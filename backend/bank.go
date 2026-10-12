package main

import (
	"embed"
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"math"
	"regexp"
	"slices"
	"strconv"
	"strings"
	"unicode/utf8"
)

// Банк тестов живёт только на сервере: фронт получает вопросы без ответов и пояснений,
// ответы ученика проверяет сервер, он же ведёт счёт попыток. Файлы в tests/ — по одному на класс,
// внутри {"класс/предмет": {"тема": тест}}.
//
//go:embed tests/*.json
var bankFiles embed.FS

// столько попыток даётся на тест; то же число — MAX_ATTEMPTS на фронте
const maxAttempts = 3

// Предметы, где ответ со свободным вводом однозначен (дробь, число, формула): сверки с эталоном достаточно.
// В остальных не совпавший с эталоном ответ смотрит арбитр. Вопросу это переопределяет поле judge.
var exactSubjects = map[string]bool{"math": true}

// ответ со свободным вводом длиннее этого не храним: в поле для слова или числа сочинение не пишут
const maxGivenRunes = 500

type Question struct {
	Type        string          `json:"type"`
	Text        string          `json:"text"`
	Options     []string        `json:"options,omitempty"`
	Answer      json.RawMessage `json:"answer"`
	Hint        string          `json:"hint,omitempty"`
	Placeholder string          `json:"placeholder,omitempty"`
	Unit        string          `json:"unit,omitempty"`
	Tolerance   float64         `json:"tolerance,omitempty"`
	Judge       *bool           `json:"judge,omitempty"`

	// разобранный эталон: номер варианта, набор номеров, число или список допустимых написаний
	choice   int
	multi    []int
	number   float64
	accepted []string
}

type Test struct {
	Title     string     `json:"title"`
	TitleRu   string     `json:"titleRu,omitempty"`
	Questions []Question `json:"questions"`
}

// Bank — все тесты по ключу темы "класс/предмет|тема", как его собирает фронт в testKey().
type Bank map[string]*Test

// QuestionView — вопрос, каким его видит ученик. Эталон и пояснение — только когда тест закрыт.
type QuestionView struct {
	Type        string          `json:"type"`
	Text        string          `json:"text"`
	Options     []string        `json:"options,omitempty"`
	Placeholder string          `json:"placeholder,omitempty"`
	Unit        string          `json:"unit,omitempty"`
	Answer      json.RawMessage `json:"answer,omitempty"`
	Hint        string          `json:"hint,omitempty"`
}

// snapshotQuestion — вопрос в снимке попытки: каким его видел ученик, его ответ и что из этого верно.
// Снимок хранится целиком, чтобы разбор не поехал, когда банк поправят. judge: true — ответ можно отдать арбитру.
type snapshotQuestion struct {
	Type    string          `json:"type"`
	Text    string          `json:"text"`
	Options []string        `json:"options,omitempty"`
	Answer  json.RawMessage `json:"answer"`
	Unit    string          `json:"unit,omitempty"`
	Hint    string          `json:"hint,omitempty"`
	Given   any             `json:"given"`
	Right   bool            `json:"right"`
	Judge   bool            `json:"judge,omitempty"`
}

// банк проверяем при старте: опечатка в эталоне должна ронять сервер сразу, а не тихо валить ученика
func loadBank() (Bank, error) {
	files, err := fs.Glob(bankFiles, "tests/*.json")
	if err != nil {
		return nil, err
	}

	bank := Bank{}
	for _, name := range files {
		raw, err := bankFiles.ReadFile(name)
		if err != nil {
			return nil, err
		}

		var subjects map[string]map[string]*Test
		if err := json.Unmarshal(raw, &subjects); err != nil {
			return nil, fmt.Errorf("%s: %w", name, err)
		}

		for subject, topics := range subjects {
			for topic, test := range topics {
				key := subject + "|" + topic
				if err := test.prepare(); err != nil {
					return nil, fmt.Errorf("%s, %q: %w", name, key, err)
				}
				bank[key] = test
			}
		}
	}

	if len(bank) == 0 {
		return nil, errors.New("банк тестов пуст")
	}

	return bank, nil
}

func (t *Test) prepare() error {
	if len(t.Questions) == 0 {
		return errors.New("в тесте нет вопросов")
	}

	for index := range t.Questions {
		if err := t.Questions[index].prepare(); err != nil {
			return fmt.Errorf("вопрос %d: %w", index+1, err)
		}
	}

	return nil
}

func (q *Question) prepare() error {
	switch q.Type {
	case "choice":
		if err := json.Unmarshal(q.Answer, &q.choice); err != nil || q.choice < 0 || q.choice >= len(q.Options) {
			return errors.New("ответ — не номер варианта")
		}
	case "multi":
		if err := json.Unmarshal(q.Answer, &q.multi); err != nil || len(q.multi) == 0 {
			return errors.New("ответ — не список номеров вариантов")
		}
		for _, index := range q.multi {
			if index < 0 || index >= len(q.Options) {
				return errors.New("в ответе номер несуществующего варианта")
			}
		}
		slices.Sort(q.multi)
	case "number":
		if err := json.Unmarshal(q.Answer, &q.number); err != nil {
			return errors.New("ответ — не число")
		}
	case "input":
		var one string
		if json.Unmarshal(q.Answer, &one) == nil {
			q.accepted = []string{one}
		} else if err := json.Unmarshal(q.Answer, &q.accepted); err != nil {
			return errors.New("ответ — не строка и не список строк")
		}
		if len(q.accepted) == 0 {
			return errors.New("нет ни одного допустимого ответа")
		}
	default:
		return fmt.Errorf("неизвестный тип %q", q.Type)
	}

	return nil
}

// view — вопросы теста для ученика; reveal добавляет эталон и пояснение
func (t *Test) view(reveal bool) []QuestionView {
	views := make([]QuestionView, len(t.Questions))
	for index, question := range t.Questions {
		views[index] = QuestionView{
			Type:        question.Type,
			Text:        question.Text,
			Options:     question.Options,
			Placeholder: question.Placeholder,
			Unit:        question.Unit,
		}
		if reveal {
			views[index].Answer = question.Answer
			views[index].Hint = question.Hint
		}
	}

	return views
}

// closed: тест сдан или попытки кончились — тогда, и только тогда, ученику можно видеть правильные ответы
func closed(record Record) bool {
	return record.Passed || record.Attempts >= maxAttempts
}

// grade проверяет ответы попытки и собирает её снимок. Ответы сорванной попытки не проверяются:
// она засчитывается с нулём верных.
func grade(key string, test *Test, answers []any, violation string) Attempt {
	subject, _, _ := strings.Cut(key, "|")
	exact := exactSubject(subject)

	questions := make([]snapshotQuestion, len(test.Questions))
	score := 0
	for index, question := range test.Questions {
		var given any
		if index < len(answers) {
			given = cleanGiven(answers[index])
		}

		right := violation == "" && question.check(given, exact)
		if right {
			score++
		}

		questions[index] = snapshotQuestion{
			Type:    question.Type,
			Text:    question.Text,
			Options: question.Options,
			Answer:  question.Answer,
			Unit:    question.Unit,
			Hint:    question.Hint,
			Given:   given,
			Right:   right,
			Judge:   question.needsJudge(exact),
		}
	}

	raw, err := json.Marshal(questions)
	if err != nil {
		// снимок собран из банка и проверенных ответов — сломаться тут нечему
		panic(err)
	}

	total := len(test.Questions)

	return Attempt{
		Score:     score,
		Total:     total,
		Pass:      total,
		Passed:    score >= total,
		Violation: violation,
		Questions: raw,
	}
}

// redact убирает из снимка то, что нельзя показывать, пока тест не закрыт: эталон, пояснение
// и причину отказа арбитра (она может подсказать ответ). Служебная пометка для арбитра не нужна фронту вовсе.
func redact(raw json.RawMessage, reveal bool) json.RawMessage {
	var questions []map[string]any
	if err := json.Unmarshal(raw, &questions); err != nil {
		return json.RawMessage("[]")
	}

	for _, question := range questions {
		delete(question, "judge")
		if reveal {
			continue
		}

		delete(question, "answer")
		delete(question, "hint")
		if verdict, ok := question["verdict"].(map[string]any); ok {
			if correct, _ := verdict["correct"].(bool); !correct {
				delete(verdict, "reason")
			}
		}
	}

	result, err := json.Marshal(questions)
	if err != nil {
		return json.RawMessage("[]")
	}

	return result
}

func exactSubject(subject string) bool {
	_, id, _ := strings.Cut(subject, "/")
	// у предмета в разных классах бывает номер: six/math2 — та же математика
	return exactSubjects[strings.TrimRight(id, "0123456789")]
}

func (q *Question) needsJudge(exact bool) bool {
	if q.Type != "input" {
		return false
	}

	if q.Judge != nil {
		return *q.Judge
	}

	return !exact
}

// cleanGiven оставляет от ответа ученика то, что может прийти из формы: строку, номер варианта или набор номеров
func cleanGiven(value any) any {
	switch given := value.(type) {
	case string:
		if utf8.RuneCountInString(given) > maxGivenRunes {
			return string([]rune(given)[:maxGivenRunes])
		}
		return given
	case float64:
		return given
	case []any:
		list := []any{}
		for _, item := range given {
			if number, ok := item.(float64); ok {
				list = append(list, number)
			}
		}
		return list
	default:
		return nil
	}
}

// check — верен ли ответ: в точных предметах ввод сверяется строго, в остальных — после looseNormalize
func (q *Question) check(given any, exact bool) bool {
	switch q.Type {
	case "choice":
		index, ok := given.(float64)
		return ok && index == float64(q.choice)
	case "multi":
		list, ok := given.([]any)
		if !ok || len(list) != len(q.multi) {
			return false
		}
		picked := make([]float64, 0, len(list))
		for _, item := range list {
			picked = append(picked, item.(float64))
		}
		slices.Sort(picked)
		for index, value := range picked {
			if value != float64(q.multi[index]) {
				return false
			}
		}
		return true
	case "number":
		value, ok := toNumber(givenText(given))
		return ok && math.Abs(value-q.number) <= q.Tolerance
	default:
		text := givenText(given)
		if text == "" {
			return false
		}
		prepare := looseNormalize
		if exact {
			prepare = normalize
		}
		for _, item := range q.accepted {
			if prepare(item) == prepare(text) {
				return true
			}
		}
		return false
	}
}

func givenText(given any) string {
	switch value := given.(type) {
	case string:
		return value
	case float64:
		return strconv.FormatFloat(value, 'f', -1, 64)
	default:
		return ""
	}
}

// ученик может ввести типографские минус и апостроф — приводим к обычным
var typography = strings.NewReplacer("−", "-", "–", "-", "—", "-", "′", "'", "’", "'", "`", "'")

// strings.Fields режет и по неразрывным пробелам, так что они тоже становятся обычными
func normalize(value string) string {
	return strings.Join(strings.Fields(typography.Replace(strings.ToLower(value))), " ")
}

// знаки препинания по краям ответа («Мы живём в Сербии.»); апостроф не трогаем — он часть ответа
const edgePunctuation = " .,!?;:…\"«»„“”"

// Нормализация для предметов, где ответ пишут словами: к обычной добавляются алфавит, ё и знаки по краям.
func looseNormalize(value string) string {
	value = strings.ReplaceAll(normalize(value), "ё", "е")
	return latinToCyrillic(strings.Trim(value, edgePunctuation))
}

// Сербская латиница однозначно переводится в кириллицу: «budem radio» и «будем радио» — один ответ.
var latinDigraphs = map[string]string{"dž": "џ", "lj": "љ", "nj": "њ"}

var latinLetters = map[rune]rune{
	'a': 'а', 'b': 'б', 'c': 'ц', 'č': 'ч', 'ć': 'ћ', 'd': 'д', 'đ': 'ђ', 'e': 'е', 'f': 'ф', 'g': 'г', 'h': 'х',
	'i': 'и', 'j': 'ј', 'k': 'к', 'l': 'л', 'm': 'м', 'n': 'н', 'o': 'о', 'p': 'п', 'r': 'р', 's': 'с', 'š': 'ш',
	't': 'т', 'u': 'у', 'v': 'в', 'z': 'з', 'ž': 'ж',
}

func latinToCyrillic(value string) string {
	runes := []rune(value)

	var result strings.Builder
	for index := 0; index < len(runes); index++ {
		if index+1 < len(runes) {
			if letter, ok := latinDigraphs[string(runes[index:index+2])]; ok {
				result.WriteString(letter)
				index++
				continue
			}
		}

		if letter, ok := latinLetters[runes[index]]; ok {
			result.WriteRune(letter)
		} else {
			result.WriteRune(runes[index])
		}
	}

	return result.String()
}

var numberPattern = regexp.MustCompile(`^[-+]?\d*\.?\d+$`)

// число принимаем и с запятой, и с точкой
func toNumber(value string) (float64, bool) {
	cleaned := strings.Replace(strings.ReplaceAll(normalize(value), " ", ""), ",", ".", 1)
	if !numberPattern.MatchString(cleaned) {
		return 0, false
	}

	number, err := strconv.ParseFloat(cleaned, 64)

	return number, err == nil
}
