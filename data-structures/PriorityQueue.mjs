export class Heap {
  #queue;
  #compare;

  constructor(compare = (a, b) => a <= b, elems = []) {
    this.#queue = [...elems];
    this.#compare = compare;
  }

  #getChildren(n) {
    return [4 * n + 1, 4 * n + 2, 4 * n + 3, 4 * n + 4]
      .filter((index) => index < this.#queue.length)
      .map((index) => {
        return { idx: index, val: this.#queue[index] };
      })
      .sort((a, b) => this.#compare(b.val, a.val));
  }

  #getParent(n) {
    if (n <= 0) return undefined;
    const index = Math.floor((n - 1) / 4);
    return {
      idx: index,
      val: this.#queue.at(index),
    };
  }

  pop() {
    if (this.#queue.length == 0) return undefined;

    const min = this.#queue[0];
    const end = this.#queue.pop();

    let n = 0;
    while (true) {
      const minChild = this.#getChildren(n).at(0);
      if (!minChild || this.#compare(end, minChild.val)) {
        this.#queue[n] = end;
        break;
      }
      this.#queue[n] = minChild.val;
      n = minChild.idx;
    }

    return min;
  }

  insert(...vals) {
    for (const val of vals) {
      this.#queue.push(val);
      let n = this.#queue.length - 1;
      while (true) {
        const parent = this.#getParent(n);
        console.log(parent);
        if (!parent || this.#compare(parent.val, val)) return;
        this.#queue[parent.idx] = val;
        this.#queue[n] = parent.val;
        if (n == parent.idx) break;
        n = parent.idx;
      }
    }
  }
}
