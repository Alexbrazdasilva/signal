import { $on, $signal } from './channel';

export function setupCounter(element) {
  const foo = $signal(0);

  const button = document.createElement('button');
  const buttonMinus = document.createElement('button');
  const value = document.createElement('h3');

  button.addEventListener('click', () => foo.value++);
  buttonMinus.addEventListener('click', () => foo.value--);

  $on(foo, (val, oldVal) => (button.textContent = `+1`));
  $on(foo, (val, oldVal) => (button.style.color = val > 5 ? 'red' : 'black'));
  $on(foo, (val) => (value.textContent = `Valor atual ${val}`));
  $on(foo, (val, oldVal) => (buttonMinus.textContent = `-1`));

  foo.value++;

  element.appendChild(value);
  element.appendChild(buttonMinus);
  element.appendChild(button);
}
