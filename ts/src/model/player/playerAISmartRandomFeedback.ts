class PlayerAISmartRandomFeedback extends PlayerAI {
  constructor(markType: MarkType) {
    super(markType);
  }

  private markTypeToStatus(markType: MarkType) {
    return markType === MarkType.O ?
           BoardStatus.NoughtWin : BoardStatus.CrossWin;
  }

  private getOtherMarkType(markType: MarkType = this.markType) {
    return markType === MarkType.O ? MarkType.X : MarkType.O;
  }

  // Get all valid moves that do not lose immediately
  private getValidMovesThatDoNotLose(board: GlobalBoard,
                                     markType: MarkType = this.markType) {
    let moves = this.getValidMoves(board);
    return this.filterMovesThatLoseGame(board, markType, moves);
  }

  // Get all moves that wins a local board
  private getMovesThatWinsLocalBoard(board: GlobalBoard,
                                     markType: MarkType): BoardPosition[] {
    let winningMoves = [];

    for (let move of this.getValidMoves(board)) {
      // Copy board state and make move
      let boardCopy = board.copy();
      boardCopy.setCellValue(markType, move.globalIndex, move.localIndex);
      boardCopy.updateActiveBoards(move.localIndex);

      // Check win
      let localBoard = boardCopy.getLocalBoardByIndex(move.globalIndex);
      if (localBoard.getStatus() === this.markTypeToStatus(markType)) {
        winningMoves.push(move);
      }
    }

    return winningMoves;
  }

  // Get move that wins game immediately
  private getMoveThatWinsGame(board: GlobalBoard,
                              markType: MarkType): BoardPosition | null {
    for (let move of this.getValidMoves(board)) {
      // Copy board state and make move
      let boardCopy = board.copy();
      boardCopy.setCellValue(markType, move.globalIndex, move.localIndex);
      boardCopy.updateActiveBoards(move.localIndex);

      // Check win
      if (boardCopy.getStatus() === this.markTypeToStatus(markType)) {
        return move;
      }
    }

    // No moves win game
    return null;
  }

  // Filter moves that loses game immediately
  // Warning: Can filter the move that wins game immediately
  // TODO Untested
  private filterMovesThatLoseGame(board: GlobalBoard, markType: MarkType,
                                  moves: BoardPosition[]): BoardPosition[] {
    let filteredMoves = [];

    for (let move of moves) {
      let boardCopy = board.copy();

      // Make move
      boardCopy.setCellValue(markType, move.globalIndex, move.localIndex);
      boardCopy.updateActiveBoards(move.localIndex);

      if (boardCopy.getStatus() !== BoardStatus.InProgress) {
        // If game ends, opponent can't win
        filteredMoves.push(move);
      } else {
        // See if opponent can win immediately
        let winningMove = this.getMoveThatWinsGame(boardCopy,
          this.getOtherMarkType(markType));
        if (!winningMove) {
          filteredMoves.push(move);
        }
      }
    }

    return filteredMoves;
  }

  private getSmartRandomMove(board: GlobalBoard,
                             markType: MarkType): BoardPosition {
    let winningMove = this.getMoveThatWinsGame(board, this.markType);
    if (winningMove) {
      // Choose winning move if it exists
      return winningMove;
    }

    // Otherwise, choose a move that wins a local board if it exists
    // Filter moves that lose immediately
    let potentialMoves = this.getMovesThatWinsLocalBoard(board, this.markType);
    let goodMoves = this.filterMovesThatLoseGame(board, markType,
                                                 potentialMoves);
    if (goodMoves.length !== 0) {
      return goodMoves[0];
    }

    // Otherwise, choose a random move
    let validMoves = this.getValidMoves(board);
    let filteredMoves = this.filterMovesThatLoseGame(board, markType,
                                                     validMoves);

    if (filteredMoves.length !== 0) {
      return filteredMoves[Math.floor(Math.random()*filteredMoves.length)];
    }

    return validMoves[Math.floor(Math.random()*filteredMoves.length)];
  }

  private simulatePlayout(board: GlobalBoard,
                          currentMarkType: MarkType): BoardStatus {
    let boardCopy = board.copy();

    // Simulate game until it ends
    while (boardCopy.getStatus() === BoardStatus.InProgress) {
      let move = this.getSmartRandomMove(boardCopy, currentMarkType);

      boardCopy.setCellValue(currentMarkType, move.globalIndex,
                             move.localIndex);
      boardCopy.updateActiveBoards(move.localIndex);

      // Switch player
      currentMarkType = this.getOtherMarkType(currentMarkType);
    }

    return boardCopy.getStatus();
  }

  // Evaluate position of a board by smart random playouts
  // 1 -> perfect for X
  // 0 -> perfect for O
  private evaluateBoard(board: GlobalBoard, currentMarkType: MarkType,
                        numPlayouts: number = 100): number {
    let absScore = 0;

    for (let i = 0; i < numPlayouts; i++) {
      // Simulate game until it ends
      let status = this.simulatePlayout(board, currentMarkType);

      if (status === BoardStatus.CrossWin) absScore++;
      if (status === BoardStatus.Draw)     absScore += 0.5;
    }

    return absScore / numPlayouts;
  }

  protected calculateOptimalMove(boardCopy: GlobalBoard): void {
    let winningMove = this.getMoveThatWinsGame(boardCopy, this.markType);
    if (winningMove) {
      // Choose winning move if it exists
      this.optimalMove = winningMove;
      return;
    }

    let moves = this.getValidMovesThatDoNotLose(boardCopy);

    if (moves.length === 0) {
      // We're screwed: all moves immediately lose
      this.optimalMove = this.getValidMoves(boardCopy)[0];
      return;
    }

    let movesWithEval: MoveWithEvaluation[] = moves
      .map(move => <MoveWithEvaluation> { move: move, eval: 0 });
    // TODO Magic number
    // Let's do 200 playouts in total per iteration
    let numPlayouts = Math.floor(200 / moves.length);

    let optimalMoveWithEval: MoveWithEvaluation = movesWithEval[0];

    // Evaluate all moves and update optimal move
    for (let moveWithEval of movesWithEval) {
      // Make move
      let move = moveWithEval.move;
      let boardPrivateCopy = boardCopy.copy();
      boardPrivateCopy.setCellValueWithMove(this.markType, move);
      boardPrivateCopy.updateActiveBoards(move.localIndex);

      // Evaluate board
      let evaluation = this.evaluateBoard(boardPrivateCopy,
                                          this.getOtherMarkType(),
                                          numPlayouts);
      moveWithEval.eval = evaluation;
      
      if (evaluation > optimalMoveWithEval.eval) {
        optimalMoveWithEval = moveWithEval;
      }
    }

    this.optimalMove = optimalMoveWithEval.move;

    // TODO Delete
    for (let moveWithEval of movesWithEval) {
      console.log("Move");
      console.log(moveWithEval.move);
      console.log("Evaluation");
      console.log(moveWithEval.eval);
    }

    console.log(`(Smart Random) My marktype is ${this.markType}`);
    
  }
}