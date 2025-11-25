import { evaluate, derivative } from 'mathjs';

// Численное интегрирование методом трапеций
export function numericalIntegral(func, start, end, steps = 1000) {
  const h = (end - start) / steps;
  let sum = 0;

  for (let i = 0; i <= steps; i++) {
    const x = start + i * h;
    try {
      const y = evaluate(func, { x });
      if (i === 0 || i === steps) {
        sum += y;
      } else {
        sum += 2 * y;
      }
    } catch (e) {
      console.error('Integration error at x=' + x, e);
    }
  }

  return (h / 2) * sum;
}

// Поиск корней методом бисекции
export function findRoot(func, start, end, tolerance = 0.0001) {
  let a = start;
  let b = end;

  try {
    const fa = evaluate(func, { x: a });
    const fb = evaluate(func, { x: b });

    if (fa * fb > 0) {
      return null; // Нет корня на интервале
    }

    while (Math.abs(b - a) > tolerance) {
      const c = (a + b) / 2;
      const fc = evaluate(func, { x: c });

      if (Math.abs(fc) < tolerance) {
        return c;
      }

      const fa = evaluate(func, { x: a });
      if (fa * fc < 0) {
        b = c;
      } else {
        a = c;
      }
    }

    return (a + b) / 2;
  } catch (e) {
    return null;
  }
}

// Поиск всех корней на интервале
export function findAllRoots(func, start, end, segments = 100) {
  const roots = [];
  const step = (end - start) / segments;

  for (let i = 0; i < segments; i++) {
    const a = start + i * step;
    const b = a + step;
    const root = findRoot(func, a, b);

    if (root !== null) {
      // Проверяем, не нашли ли мы уже этот корень
      const isDuplicate = roots.some(r => Math.abs(r - root) < 0.01);
      if (!isDuplicate) {
        roots.push(root);
      }
    }
  }

  return roots;
}

// Поиск точек пересечения двух функций
export function findIntersections(func1, func2, start, end, segments = 100) {
  const diff = `(${func1}) - (${func2})`;
  return findAllRoots(diff, start, end, segments);
}

// Поиск экстремумов (локальных максимумов и минимумов)
export function findExtrema(func, start, end, segments = 100) {
  const extrema = [];

  try {
    const derivativeFunc = derivative(func, 'x').toString();
    const criticalPoints = findAllRoots(derivativeFunc, start, end, segments);

    // Проверяем каждую критическую точку
    for (const x of criticalPoints) {
      try {
        const y = evaluate(func, { x });

        // Проверяем знак второй производной
        const secondDerivFunc = derivative(derivativeFunc, 'x').toString();
        const secondDeriv = evaluate(secondDerivFunc, { x });

        if (Math.abs(secondDeriv) > 0.0001) {
          extrema.push({
            x,
            y,
            type: secondDeriv < 0 ? 'max' : 'min'
          });
        }
      } catch (e) {
        // Игнорируем точки с ошибками
      }
    }
  } catch (e) {
    console.error('Error finding extrema:', e);
  }

  return extrema;
}

// Поиск точек перегиба
export function findInflectionPoints(func, start, end, segments = 100) {
  const inflectionPoints = [];

  try {
    const firstDeriv = derivative(func, 'x').toString();
    const secondDeriv = derivative(firstDeriv, 'x').toString();
    const inflectionXs = findAllRoots(secondDeriv, start, end, segments);

    for (const x of inflectionXs) {
      try {
        const y = evaluate(func, { x });
        inflectionPoints.push({ x, y });
      } catch (e) {
        // Игнорируем точки с ошибками
      }
    }
  } catch (e) {
    console.error('Error finding inflection points:', e);
  }

  return inflectionPoints;
}

// Вычисление касательной в точке
export function getTangentLine(func, x0) {
  try {
    const y0 = evaluate(func, { x: x0 });
    const derivativeFunc = derivative(func, 'x').toString();
    const slope = evaluate(derivativeFunc, { x: x0 });

    // Уравнение касательной: y = y0 + slope * (x - x0)
    return {
      func: `${y0} + ${slope} * (x - ${x0})`,
      slope,
      point: { x: x0, y: y0 }
    };
  } catch (e) {
    console.error('Error computing tangent:', e);
    return null;
  }
}

// Вычисление нормали в точке
export function getNormalLine(func, x0) {
  try {
    const tangent = getTangentLine(func, x0);
    if (!tangent || tangent.slope === 0) return null;

    const normalSlope = -1 / tangent.slope;

    // Уравнение нормали: y = y0 + normalSlope * (x - x0)
    return {
      func: `${tangent.point.y} + ${normalSlope} * (x - ${x0})`,
      slope: normalSlope,
      point: tangent.point
    };
  } catch (e) {
    console.error('Error computing normal:', e);
    return null;
  }
}

// Поиск асимптот
export function findAsymptotes(func, start, end) {
  const asymptotes = {
    vertical: [],
    horizontal: null,
    oblique: null
  };

  try {
    // Вертикальные асимптоты (где функция стремится к бесконечности)
    const step = (end - start) / 100;
    for (let x = start; x <= end; x += step) {
      try {
        const y = evaluate(func, { x });
        const yNext = evaluate(func, { x: x + step / 10 });

        if (Math.abs(y) > 1000 || Math.abs(yNext) > 1000) {
          if (Math.abs(y - yNext) > 100) {
            const isDuplicate = asymptotes.vertical.some(a => Math.abs(a - x) < 0.5);
            if (!isDuplicate) {
              asymptotes.vertical.push(x);
            }
          }
        }
      } catch (e) {
        // Точка разрыва - возможная вертикальная асимптота
        const isDuplicate = asymptotes.vertical.some(a => Math.abs(a - x) < 0.5);
        if (!isDuplicate) {
          asymptotes.vertical.push(x);
        }
      }
    }

    // Горизонтальные асимптоты (предел на бесконечности)
    try {
      const yAtInf = evaluate(func, { x: 1000 });
      const yAtInf2 = evaluate(func, { x: 10000 });
      if (Math.abs(yAtInf - yAtInf2) < 0.1 && Math.abs(yAtInf) < 1000) {
        asymptotes.horizontal = yAtInf;
      }
    } catch (e) {
      // Нет горизонтальной асимптоты
    }
  } catch (e) {
    console.error('Error finding asymptotes:', e);
  }

  return asymptotes;
}

// Преобразование полярных координат в декартовы
export function polarToCartesian(r, theta) {
  return {
    x: r * Math.cos(theta),
    y: r * Math.sin(theta)
  };
}

// Генерация точек для полярного графика
export function generatePolarPoints(rFunc, thetaStart, thetaEnd, count) {
  const points = [];
  const step = (thetaEnd - thetaStart) / count;

  for (let i = 0; i <= count; i++) {
    const theta = thetaStart + i * step;
    try {
      const r = evaluate(rFunc, { x: theta });
      const cartesian = polarToCartesian(r, theta);
      points.push(cartesian);
    } catch (e) {
      console.error('Error at theta=' + theta, e);
    }
  }

  return points;
}
