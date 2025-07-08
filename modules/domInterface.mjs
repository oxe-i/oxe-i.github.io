export class ElementWrapper {
  #elem;
  #style;
  #updated;

  constructor(elem) {
    if (elem instanceof HTMLElement) {
      this.#elem = elem;
      this.#style = getComputedStyle(this.#elem);
      this.#updated = true;
      return;
    }
    if (elem instanceof ElementWrapper) {
      this.#elem = elem.#elem;
      this.#style = elem.#style;
      this.#updated = elem.#updated;
      return;
    }
    this.#elem = undefined;
    this.#style = undefined;
    this.#updated = undefined;
  }

  removeParent(parent) {
    if (parent instanceof HTMLElement || parent instanceof ElementWrapper) {
      parent.removeChild(this.#elem);
    }
  }

  removeChild(child) {
    if (child instanceof HTMLElement) {
      this.#elem.removeChild(child);
      return;
    }
    if (child instanceof ElementWrapper) {
      this.#elem.removeChild(child.#elem);
    }
  }

  appendParent(parent) {
    if (parent instanceof HTMLElement || parent instanceof ElementWrapper) {
      parent.appendChild(this.#elem);
    }
  }

  appendChild(child) {
    if (child instanceof HTMLElement) {
      this.#elem.appendChild(child);
      return;
    }
    if (child instanceof ElementWrapper) {
      this.#elem.appendChild(child.#elem);
    }
  }

  addStyle(type, value) {
    this.#elem.style.setProperty(`${type}`, `${value}`);
    this.#updated = false;
  }

  getStyle(type) {
    if (!this.#updated) this.updateStyle();
    return this.#style.getPropertyValue(`${type}`);
  }

  addClass(className) {
    this.#elem.classList.add(className);
  }

  removeClass(className) {
    this.#elem.classList.remove(className);
  }

  removeClasses() {
    this.#elem.className = "";
  }

  checkClass(className) {
    return this.#elem.classList.contains(className);
  }

  addAttribute(attribute, value = true) {
    this.#elem.setAttribute(`${attribute}`, `${value}`);
  }

  removeAttribute(attribute) {
    this.#elem.removeAttribute(`${attribute}`);
  }

  updateStyle() {
    this.#style = getComputedStyle(this.#elem);
    this.#updated = true;
  }

  get boundingRect() {
    return this.#elem.getBoundingClientRect();
  }
}

export class TabList {
  #container;
  #list;
  #tabs;
  #crtTabIdx;
  #closeButton;
  #endCallBack;

  constructor(container) {
    this.#container = container;
    this.#list = container.querySelector("[role='tablist']");
    this.#tabs = [...this.#list.querySelectorAll("[role='tab']")].map((tab) => {
      const panel = this.#container.querySelector(
        `#${tab.getAttribute("aria-controls")}`
      );

      return {
        tab: tab,
        panel: panel,
      };
    });

    this.#closeButton = this.#container.querySelector("[data-role='close']");
    this.#closeButton.addEventListener("click", () => {
      this.handleClose();
    });
    this.#closeButton.addEventListener("keydown", (event) => {
      switch (event.key) {
        case "ArrowUp":
        case "W":
        case "w":
          this.#tabs[this.#crtTabIdx].panel.focus();
          return;
      }
    })

    this.#tabs.forEach(({ tab, panel }, idx) => {
      tab.addEventListener("keydown", (event) => {
        switch (event.key) {
          case "ArrowRight":
          case "D":
          case "d":
            this.goToNextTab();
            return;
          case "ArrowLeft":
          case "A":
          case "a":
            this.gotToPreviousTab();
            return;
          case "ArrowDown":
          case "S":
          case "s":
            panel.focus();
            return;
          case " ":
            window.location.hash = tab.getAttribute("aria-controls");
            return;
        }
      });

      panel.addEventListener("keydown", (event) => {
        switch (event.key) {
          case "ArrowUp":
          case "W":
          case "w":
          case "Home":
            tab.focus();
            return;
          case "ArrowDown":
          case "S":
          case "s":
            this.#closeButton.focus();
            return;
        }
      });

      tab.addEventListener("click", () => {
        this.#crtTabIdx = idx;
        this.#activateTabOnIdx();
      });
    });

    this.#list.addEventListener("keydown", (event) => {
      switch (event.key) {
        case "Home":
          this.#crtTabIdx = 0;
          this.#activateTabOnIdx();
          return;
      }
    });

    this.#container.addEventListener("keydown", (event) => {
      switch (event.key) {
        case "Escape":
          this.#crtTabIdx = 0;
          this.#activateTabOnIdx();
          this.handleClose();
          return;
      }
    });

    this.#crtTabIdx = 0;
    this.#activateTabOnIdx();
  }

  #activateTabOnIdx() {
    this.#tabs.forEach(({ tab }) => {
      tab.setAttribute("aria-selected", false);
      tab.setAttribute("tabindex", -1);
    });
    const tabPanel = this.#tabs.at(this.#crtTabIdx);
    tabPanel?.tab?.setAttribute("aria-selected", true);
    tabPanel?.tab?.setAttribute("tabindex", 0);
    tabPanel?.tab.focus();
  }

  goToNextTab() {
    this.#crtTabIdx = (this.#crtTabIdx + 1) % this.#tabs.length;
    this.#activateTabOnIdx();
  }

  gotToPreviousTab() {
    this.#crtTabIdx = (this.#crtTabIdx - 1) % this.#tabs.length;
    this.#activateTabOnIdx();
  }

  handleClose() {
    this.#crtTabIdx = 0;
    this.#activateTabOnIdx();
    this.#endCallBack?.();
  }

  setEndBehaviour(callback) {
    this.#endCallBack = callback;
  }
}
