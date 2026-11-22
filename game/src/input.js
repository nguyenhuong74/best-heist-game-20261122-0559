// input.js — keyboard and mouse state for The Amber Vault.
// Keys: WASD / arrows to move, Shift to sneak, E to interact, 1/2/3 for
// tools, Space to start / restart, M to mute. Mouse: click to throw a smoke
// bomb at the clicked spot, click buttons on the title and end screens.

export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set(); // keys pressed since last consume (edge trigger)
  const mouse = { x: 0, y: 0, clicked: false, clickX: 0, clickY: 0 };

  const KEYMAP = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
    ShiftLeft: 'sneak', ShiftRight: 'sneak',
    KeyE: 'interact',
    Digit1: 'smoke', Numpad1: 'smoke',
    Digit2: 'emp', Numpad2: 'emp',
    Digit3: 'disguise', Numpad3: 'disguise',
    Space: 'confirm',
    KeyM: 'mute',
    KeyR: 'restart',
  };

  // Note: `pressed` is drained by wasPressed, so a key held across frames
  // fires its action exactly once — important for tools, which cost score
  // and have limited uses. Holding 1 must never burn two smoke bombs.
  function onKeyDown(event) {
    const action = KEYMAP[event.code];
    if (!action) return;
    if (['up', 'down', 'left', 'right', 'confirm'].includes(action)) event.preventDefault();
    if (!event.repeat) pressed.add(action);
    keys.add(action);
  }

  function onKeyUp(event) {
    const action = KEYMAP[event.code];
    if (action) keys.delete(action);
  }

  function onMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (event.clientX - rect.left) * (canvas.width / rect.width);
    mouse.y = (event.clientY - rect.top) * (canvas.height / rect.height);
  }

  function onMouseDown(event) {
    onMouseMove(event);
    mouse.clicked = true;
    mouse.clickX = mouse.x;
    mouse.clickY = mouse.y;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);

  return {
    // Held-state queries, read every frame.
    get moveX() {
      return (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0);
    },
    get moveY() {
      return (keys.has('down') ? 1 : 0) - (keys.has('up') ? 1 : 0);
    },
    get sneaking() { return keys.has('sneak'); },
    get interacting() { return keys.has('interact'); },
    mouse,
    // Edge-triggered queries: true once per physical press.
    wasPressed(action) {
      if (pressed.has(action)) { pressed.delete(action); return true; }
      return false;
    },
    consumeClick() {
      if (!mouse.clicked) return null;
      mouse.clicked = false;
      return { x: mouse.clickX, y: mouse.clickY };
    },
    clearPressed() { pressed.clear(); },
  };
}
