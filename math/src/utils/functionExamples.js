// Галерея предустановленных примеров функций
export const functionExamples = {
  basic: {
    name: 'Базовые функции',
    examples: [
      { fn: 'x', count: 50, label: 'Линейная', color: '#4285F4' },
      { fn: 'x^2', count: 50, label: 'Квадратичная', color: '#EA4335' },
      { fn: 'x^3', count: 50, label: 'Кубическая', color: '#FBBC04' },
      { fn: 'sqrt(abs(x))', count: 50, label: 'Корень', color: '#34A853' },
      { fn: '1/x', count: 50, label: 'Гипербола', color: '#FF6D00' }
    ]
  },
  trigonometric: {
    name: 'Тригонометрические',
    examples: [
      { fn: 'sin(x)', count: 100, label: 'Синус', color: '#9C27B0' },
      { fn: 'cos(x)', count: 100, label: 'Косинус', color: '#3F51B5' },
      { fn: 'tan(x)', count: 100, label: 'Тангенс', color: '#00BCD4' },
      { fn: 'sin(x) + cos(x)', count: 100, label: 'Сумма', color: '#009688' },
      { fn: 'sin(x) * cos(x)', count: 100, label: 'Произведение', color: '#4CAF50' }
    ]
  },
  exponential: {
    name: 'Показательные и логарифмы',
    examples: [
      { fn: 'e^x', count: 50, label: 'Экспонента', color: '#FF5722' },
      { fn: 'e^(-x)', count: 50, label: 'Убывающая экспонента', color: '#795548' },
      { fn: 'log(x)', count: 50, label: 'Натуральный логарифм', color: '#607D8B' },
      { fn: '2^x', count: 50, label: 'Степень двойки', color: '#E91E63' },
      { fn: 'log10(x)', count: 50, label: 'Десятичный логарифм', color: '#9E9E9E' }
    ]
  },
  animated: {
    name: 'Анимированные',
    examples: [
      { fn: 'sin(x + t)', count: 100, label: 'Бегущая волна', color: '#2196F3' },
      { fn: 'sin(x) * cos(t)', count: 100, label: 'Модулированная', color: '#F44336' },
      { fn: 'sin(x * cos(t))', count: 100, label: 'Частотная модуляция', color: '#4CAF50' },
      { fn: 'x * sin(t)', count: 50, label: 'Вращение', color: '#FF9800' },
      { fn: 'sin(x) + t % 10', count: 100, label: 'Сдвиг', color: '#9C27B0' }
    ]
  },
  parametric: {
    name: 'Параметрические (x(t), y(t))',
    examples: [
      { fn: 'cos(x)', fnY: 'sin(x)', count: 100, label: 'Окружность', color: '#E91E63', type: 'parametric' },
      { fn: 'x * cos(x)', fnY: 'x * sin(x)', count: 100, label: 'Спираль', color: '#673AB7', type: 'parametric' },
      { fn: 'cos(x) + cos(3*x)/3', fnY: 'sin(x) - sin(3*x)/3', count: 200, label: 'Эпициклоида', color: '#3F51B5', type: 'parametric' }
    ]
  },
  polar: {
    name: 'Полярные координаты r(θ)',
    examples: [
      { fn: '1 + cos(x)', count: 100, label: 'Кардиоида', color: '#F44336', type: 'polar' },
      { fn: 'sin(2*x)', count: 100, label: 'Роза (4 лепестка)', color: '#E91E63', type: 'polar' },
      { fn: 'sin(3*x)', count: 100, label: 'Роза (3 лепестка)', color: '#9C27B0', type: 'polar' },
      { fn: '2 + 2*cos(x)', count: 100, label: 'Улитка Паскаля', color: '#3F51B5', type: 'polar' },
      { fn: 'e^(0.1*x)', count: 200, label: 'Спираль Архимеда', color: '#009688', type: 'polar' }
    ]
  },
  complex: {
    name: 'Сложные функции',
    examples: [
      { fn: 'sin(x) / x', count: 100, label: 'Sinc', color: '#00BCD4' },
      { fn: 'abs(sin(x))', count: 100, label: 'Выпрямленный синус', color: '#4CAF50' },
      { fn: 'sin(x^2)', count: 100, label: 'Интеграл Френеля', color: '#8BC34A' },
      { fn: 'x * sin(10/x)', count: 100, label: 'Затухающие колебания', color: '#CDDC39' },
      { fn: 'e^(-x^2/10)', count: 100, label: 'Гауссиана', color: '#FFC107' }
    ]
  }
};

// Цветовая палитра по умолчанию
export const defaultColors = [
  '#4285F4', '#EA4335', '#FBBC04', '#34A853', '#9C27B0',
  '#FF6D00', '#00BCD4', '#E91E63', '#3F51B5', '#009688',
  '#FF5722', '#795548', '#607D8B', '#8BC34A', '#FFC107'
];
