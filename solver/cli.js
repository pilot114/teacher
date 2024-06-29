import { generateTask } from './tasks.js';
import readline from 'readline-sync';

while (true) {
    const task = generateTask();
    console.log('### ' + task.title + ' ###');
    console.log('(' + task.answer + ')');
    const userAnswer = readline.question(task.question + "\n");
    if (Number(userAnswer) === task.answer) {
        console.log('+');
    } else {
        console.log('-');
    }
}

// фичи:
// объединить params и templates для более логичных граничных значений
// - pluralize
// - формула решения как подсказка (тогда за правильный ответ дается 1 балл)
// тег для геометрических задач
// что делать с нецелыми значениями? - округление обоих ответов
