abstract class Board {
  public static NUM_ROWS = 3;
  public static NUM_COLS = 3;
  public static NUM_CELLS = 9;
  public static WIN_PATTERNS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ]

  protected cells: Cell[] = [];
  protected status: BoardStatus;

  constructor(status: BoardStatus = BoardStatus.InProgress) {
    this.status = status;
  }

  getStatus(): BoardStatus {
    return this.status;
  }

  updateAndGetStatus(): BoardStatus {
    // Do not update status if board is not in progress
    if (this.status !== BoardStatus.InProgress) {
      console.warn("Attempt to update board status when board is finished.");
      return this.status;
    }

    if (this.checkWin(MarkType.O)) {
      this.status = BoardStatus.NoughtWin;
      return this.status;
    }

    if (this.checkWin(MarkType.X)) {
      this.status = BoardStatus.CrossWin;
      return this.status;
    }

    if (this.checkFull()) {
      this.status = BoardStatus.Draw;
      return this.status;
    }

    this.status = BoardStatus.InProgress;
    return this.status;
  }

  getCellsValues(): (MarkType | null)[] {
    return this.cells.map(cell => cell.getValue());
  }

  getCellValue(row: number, col: number): MarkType | null {
    return this.cells[row * Board.NUM_COLS + col].getValue();
  }


  getCellValueByIndex(index: number): MarkType | null {
    return this.cells[index].getValue();
  }

  protected checkWin(playerValue: MarkType): boolean {
    for (let pattern of Board.WIN_PATTERNS) {
      if (this.getCellValueByIndex(pattern[0]) === playerValue &&
          this.getCellValueByIndex(pattern[1]) === playerValue &&
          this.getCellValueByIndex(pattern[2]) === playerValue) {
        return true;
      }
    }

    return false;
  }

  protected checkFull(): boolean {
    for (let cell of this.cells) {
      if (!cell.getValue()) {
        return false;
      }
    }

    return true;
  }

  // DEPRECATED Use toString
  print(): void {
    let i = 0;
    let str = "";

    for (let x = 0; x < Board.NUM_COLS; x++) {
      for (let y = 0; y < Board.NUM_ROWS; y++) {
        let value = this.cells[i].getValue()?.toString();

        if (!value) {
          value = "-"
        }

        str += `${value} `
        i++;
      }
      str += "\n";
    }

    console.log(str);
  }

  toString(): string {
    let i = 0;
    let str = "";

    for (let x = 0; x < Board.NUM_COLS; x++) {
      for (let y = 0; y < Board.NUM_ROWS; y++) {
        let value = this.cells[i].getValue()?.toString();

        if (!value) {
          value = "-"
        }

        str += `${value} `
        i++;
      }
      str += "\n";
    }

    return str;
  }
}
