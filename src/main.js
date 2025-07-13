import "./style.css";
import { setupCounter } from "./counter";

document.querySelector("#app").innerHTML = `
  <div>
    <div class="card">
      <div id="counter"></div>
    </div>
  </div>
`;

setupCounter(document.querySelector("#counter"));
