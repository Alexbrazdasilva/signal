import { $derived, $channel, $effect, $signal, $noise, $on } from "./channel";

export function setupCounter(element: Element) {
  const counter = $noise(0);
  const todos = $signal<number[]>([]);
  const states = $channel<{ todos: number[] }>({
    todos: [],
  });

  const text = document.createElement("h3");
  const button = document.createElement("button");

  $on(counter, (val) => (text.textContent = val));

  $on(todos, (val) => console.log("val", val));

  $effect(() => {
    console.log(`🚀 ~ $effect ~ todos.value:`, todos.value);
  });

  $effect(() => {
    console.log("states.todos", states.todos);
  });

  const onMount = () => {
    button.textContent = "Add +";

    button.addEventListener("click", () => {
      states.todos.push(counter.value);
      todos.value.push(counter.value);
      counter.value++;
    });

    element.appendChild(text);
    element.appendChild(button);
  };

  onMount();
}
