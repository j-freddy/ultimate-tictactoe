class GlobalBoard extends Board {
  // List of boards a player can make a move on
  private activeBoards: LocalBoard[];

  constructor() {
    super();

    this.cells = [];

    for (let i = 0; i < this.NUM_CELLS; i++) {
      this.cells.push(new LocalBoard(i));
    }

    // Shallow copy
    this.activeBoards = <LocalBoard[]> [...this.cells];
  }

  getLocalBoards(): LocalBoard[] {
    return <LocalBoard[]> this.cells;
  }

  getLocalBoard(row: number, col: number): LocalBoard {
    return <LocalBoard> this.cells[row * this.NUM_COLS + col];
  }

  getLocalBoardByIndex(index: number): LocalBoard {
    return <LocalBoard> this.cells[index];
  }

  setCellValue(value: MarkType, globalIndex: number,
               localIndex: number): void {
    if (!this.getActiveBoardsIndices().includes(globalIndex)) {
      throw new Error("Trying to set cell on non-active board.");
    }
    
    this.getLocalBoardByIndex(globalIndex).setCellValue(value, localIndex);
    this.updateAndGetStatus();
  }

  getBoardsInProgress(): LocalBoard[] {
    return this.getLocalBoards()
               .filter(board => board.getStatus() === BoardStatus.InProgress);
  }

  getActiveBoards(): LocalBoard[] {
    return this.activeBoards;
  }

  getActiveBoardsIndices(): number[] {
    return this.activeBoards.map(board => board.getIndex());
  }

  updateActiveBoards(index: number): void {
    let nextBoard = this.getLocalBoardByIndex(index);

    if (nextBoard.getStatus() === BoardStatus.InProgress) {
      this.activeBoards = [nextBoard];
    } else {
      this.activeBoards = this.getBoardsInProgress();
    }
  }
}
