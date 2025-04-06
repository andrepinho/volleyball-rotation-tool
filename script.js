document.addEventListener("DOMContentLoaded", function () {
  const court = document.querySelector(".court");
  const players = document.querySelectorAll(".player");
  const verticalLine = document.querySelector(".boundary-line.vertical");
  const horizontalLine = document.querySelector(".boundary-line.horizontal");
  const resetButton = document.getElementById("reset-button");
  const rotateButton = document.getElementById("rotate-button");
  const svgContainer = document.querySelector(".connection-lines");

  let activePlayer = null;
  let offsetX, offsetY;
  let connectionLines = [];

  // Court dimensions
  const courtWidth = court.clientWidth;
  const courtHeight = court.clientHeight;

  // Player size
  const playerSize = 60;

  // Court midpoint (to separate front and back rows)
  const courtMidY = courtHeight / 2;

  // Define default positions
  const defaultPositions = {
    player4: { left: courtWidth / 6, top: courtHeight / 4 },
    player3: { left: courtWidth / 2, top: courtHeight / 4 },
    player2: {
      left: (5 * courtWidth) / 6 - playerSize,
      top: courtHeight / 4,
    },
    player5: {
      left: courtWidth / 6,
      top: (3 * courtHeight) / 4 - playerSize,
    },
    player6: {
      left: courtWidth / 2,
      top: (3 * courtHeight) / 4 - playerSize,
    },
    player1: {
      left: (5 * courtWidth) / 6 - playerSize,
      top: (3 * courtHeight) / 4 - playerSize,
    },
  };

  // Define default player names
  const defaultNames = {
    1: "Lv",
    2: "Po",
    3: "Ce",
    4: "Op",
    5: "Po",
    6: "Lb",
  };

  // Define player relationships
  const playerRelationships = {
    4: ["5", "3"],
    3: ["6", "4", "2"],
    2: ["1", "3"],
    5: ["4", "6"],
    6: ["3", "5", "1"],
    1: ["2", "6"],
  };

  // Initialize player positions
  function initializePositions() {
    players.forEach((player) => {
      const position = defaultPositions[player.id];
      player.style.left = position.left + "px";
      player.style.top = position.top + "px";
    });
    clearRelatedHighlights();
    clearConnectionLines();
  }

  // Initialize player names
  function initializeNames() {
    for (let i = 1; i <= 6; i++) {
      document.getElementById(`input${i}`).value = defaultNames[i];
      document.getElementById(`name${i}`).innerText = defaultNames[i];
    }
  }

  // Initialize
  initializePositions();

  // Reset positions when button is clicked
  resetButton.addEventListener("click", function () {
    initializePositions();
  });

  // Rotate players when button is clicked
  rotateButton.addEventListener("click", function () {
    rotatePlayerNames();
  });

  // Rotate player names clockwise
  function rotatePlayerNames() {
    // Get current names
    const names = [];
    for (let i = 1; i <= 6; i++) {
      names.push(document.getElementById(`name${i}`).innerText);
    }

    // Rotation mapping (clockwise):
    // 4→3→2→1→6→5→4
    const rotationMap = {
      4: "5",
      3: "4",
      2: "3",
      1: "2",
      6: "1",
      5: "6",
    };

    // Apply rotation to player names on court
    const newNames = {};
    for (let i = 1; i <= 6; i++) {
      const rotatedPosition = rotationMap[i];
      newNames[rotatedPosition] = document.getElementById(`name${i}`).innerText;
    }
  }

  // Get player position data
  function getPlayerPosition(player) {
    return {
      left: parseInt(player.style.left),
      top: parseInt(player.style.top),
      right: parseInt(player.style.left) + playerSize,
      bottom: parseInt(player.style.top) + playerSize,
      centerX: parseInt(player.style.left) + playerSize / 2,
      centerY: parseInt(player.style.top) + playerSize / 2,
      position: player.dataset.position,
    };
  }

  // Clear all related player highlights
  function clearRelatedHighlights() {
    players.forEach((player) => {
      player.classList.remove("related");
      player.classList.remove("active");
    });
  }

  // Clear all connection lines
  function clearConnectionLines() {
    while (svgContainer.firstChild) {
      svgContainer.removeChild(svgContainer.firstChild);
    }
    connectionLines = [];
  }

  // Highlight related players and draw connection lines
  function highlightRelatedPlayers(player) {
    clearRelatedHighlights();
    clearConnectionLines();

    // Mark the active player
    player.classList.add("active");

    // Get the position number
    const position = player.dataset.position;

    // Get the related positions
    const relatedPositions = playerRelationships[position];

    // Highlight related players
    relatedPositions.forEach((relatedPos) => {
      const relatedPlayer = document.querySelector(
        `.player[data-position="${relatedPos}"]`
      );
      if (relatedPlayer) {
        relatedPlayer.classList.add("related");

        // Draw a connection line
        const activePos = getPlayerPosition(player);
        const relatedPlayerPos = getPlayerPosition(relatedPlayer);

        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        line.setAttribute("x1", activePos.centerX);
        line.setAttribute("y1", activePos.centerY);
        line.setAttribute("x2", relatedPlayerPos.centerX);
        line.setAttribute("y2", relatedPlayerPos.centerY);
        line.classList.add("connection-line");

        svgContainer.appendChild(line);
        connectionLines.push(line);
      }
    });
  }

  // Update connection lines based on player positions
  function updateConnectionLines() {
    if (!activePlayer) return;

    const activePos = getPlayerPosition(activePlayer);
    const position = activePlayer.dataset.position;
    const relatedPositions = playerRelationships[position];

    connectionLines.forEach((line, index) => {
      const relatedPos = relatedPositions[index];
      const relatedPlayer = document.querySelector(
        `.player[data-position="${relatedPos}"]`
      );
      if (relatedPlayer) {
        const relatedPlayerPos = getPlayerPosition(relatedPlayer);

        line.setAttribute("x1", activePos.centerX);
        line.setAttribute("y1", activePos.centerY);
        line.setAttribute("x2", relatedPlayerPos.centerX);
        line.setAttribute("y2", relatedPlayerPos.centerY);
      }
    });
  }

  // Mouse down event to start dragging
  players.forEach((player) => {
    player.addEventListener("mousedown", function (e) {
      e.preventDefault();

      // Only one player can be dragged at a time
      if (activePlayer) return;

      activePlayer = player;
      offsetX = e.clientX - player.getBoundingClientRect().left;
      offsetY = e.clientY - player.getBoundingClientRect().top;

      // Highlight related players
      highlightRelatedPlayers(player);
    });
  });

  // Mouse move event to drag player
  document.addEventListener("mousemove", function (e) {
    if (!activePlayer) return;

    const courtRect = court.getBoundingClientRect();
    let newLeft = e.clientX - courtRect.left - offsetX;
    let newTop = e.clientY - courtRect.top - offsetY;

    // Constrain to court boundaries
    newLeft = Math.max(0, Math.min(newLeft, courtWidth - playerSize));
    newTop = Math.max(0, Math.min(newTop, courtHeight - playerSize));

    // Check player position constraints
    let canMove = true;
    let blockingPlayer = null;
    let blockDirection = "";

    // Calculate new center position
    const newCenterX = newLeft + playerSize / 2;
    const newCenterY = newTop + playerSize / 2;

    // Get active player position number
    const activePosition = parseInt(activePlayer.dataset.position);

    // Check constraints between players
    players.forEach((otherPlayer) => {
      if (otherPlayer === activePlayer) return;

      const otherPos = getPlayerPosition(otherPlayer);
      const otherPosition = parseInt(otherPlayer.dataset.position);

      // Check position constraints based on volleyball rules
      switch (activePosition) {
        case 4: // Position 4 must stay in front of 5 and to the left of 3
          if (otherPosition === 5 && newCenterY > otherPos.centerY) {
            canMove = false;
            blockingPlayer = otherPlayer;
            blockDirection = "horizontal";
          } else if (otherPosition === 3 && newCenterX > otherPos.centerX) {
            canMove = false;
            blockingPlayer = otherPlayer;
            blockDirection = "vertical";
          }
          break;
        case 3: // Position 3 must stay in front of 6, to the right of 4 and to the left of 2
          if (otherPosition === 6 && newCenterY > otherPos.centerY) {
            canMove = false;
            blockingPlayer = otherPlayer;
            blockDirection = "horizontal";
          } else if (otherPosition === 4 && newCenterX < otherPos.centerX) {
            canMove = false;
            blockingPlayer = otherPlayer;
            blockDirection = "vertical";
          } else if (otherPosition === 2 && newCenterX > otherPos.centerX) {
            canMove = false;
            blockingPlayer = otherPlayer;
            blockDirection = "vertical";
          }
          break;
        case 2: // Position 2 must stay in front of 1 and to the right of 3
          if (otherPosition === 1 && newCenterY > otherPos.centerY) {
            canMove = false;
            blockingPlayer = otherPlayer;
            blockDirection = "horizontal";
          } else if (otherPosition === 3 && newCenterX < otherPos.centerX) {
            canMove = false;
            blockingPlayer = otherPlayer;
            blockDirection = "vertical";
          }
          break;
        case 5: // Position 5 must stay behind 4 and to the left of 6
          if (otherPosition === 4 && newCenterY < otherPos.centerY) {
            canMove = false;
            blockingPlayer = otherPlayer;
            blockDirection = "horizontal";
          } else if (otherPosition === 6 && newCenterX > otherPos.centerX) {
            canMove = false;
            blockingPlayer = otherPlayer;
            blockDirection = "vertical";
          }
          break;
        case 6: // Position 6 must stay behind 3, to the right of 5 and to the left of 1
          if (otherPosition === 3 && newCenterY < otherPos.centerY) {
            canMove = false;
            blockingPlayer = otherPlayer;
            blockDirection = "horizontal";
          } else if (otherPosition === 5 && newCenterX < otherPos.centerX) {
            canMove = false;
            blockingPlayer = otherPlayer;
            blockDirection = "vertical";
          } else if (otherPosition === 1 && newCenterX > otherPos.centerX) {
            canMove = false;
            blockingPlayer = otherPlayer;
            blockDirection = "vertical";
          }
          break;
        case 1: // Position 1 must stay behind 2 and to the right of 6
          if (otherPosition === 2 && newCenterY < otherPos.centerY) {
            canMove = false;
            blockingPlayer = otherPlayer;
            blockDirection = "horizontal";
          } else if (otherPosition === 6 && newCenterX < otherPos.centerX) {
            canMove = false;
            blockingPlayer = otherPlayer;
            blockDirection = "vertical";
          }
          break;
      }
    });

    if (canMove) {
      // Update position if movement is allowed
      activePlayer.style.left = newLeft + "px";
      activePlayer.style.top = newTop + "px";

      // Update connection lines
      updateConnectionLines();

      // Hide boundary lines
      verticalLine.classList.remove("active");
      horizontalLine.classList.remove("active");
    } else if (blockingPlayer) {
      // Visual feedback for blocked movement
      blockingPlayer.classList.add("highlight");
      setTimeout(() => blockingPlayer.classList.remove("highlight"), 500);

      // Show boundary line
      const blockingPos = getPlayerPosition(blockingPlayer);

      if (blockDirection === "vertical") {
        verticalLine.style.left = blockingPos.centerX + "px";
        verticalLine.classList.add("active");
        horizontalLine.classList.remove("active");
      } else {
        horizontalLine.style.top = blockingPos.centerY + "px";
        horizontalLine.classList.add("active");
        verticalLine.classList.remove("active");
      }
    }
  });

  // Mouse up event to stop dragging
  document.addEventListener("mouseup", function () {
    if (!activePlayer) return;

    activePlayer.style.zIndex = "1";
    activePlayer = null;
    verticalLine.classList.remove("active");
    horizontalLine.classList.remove("active");

    // Clear highlights and connection lines after a short delay
    setTimeout(() => {
      clearRelatedHighlights();
      clearConnectionLines();
    }, 500);
  });

  // Touch events for mobile support
  players.forEach((player) => {
    player.addEventListener("touchstart", function (e) {
      e.preventDefault();

      if (activePlayer) return;

      activePlayer = player;
      const touch = e.touches[0];
      offsetX = touch.clientX - player.getBoundingClientRect().left;
      offsetY = touch.clientY - player.getBoundingClientRect().top;

      // Highlight related players
      highlightRelatedPlayers(player);
    });
  });

  document.addEventListener("touchmove", function (e) {
    if (!activePlayer) return;

    const touch = e.touches[0];
    const courtRect = court.getBoundingClientRect();
    let newLeft = touch.clientX - courtRect.left - offsetX;
    let newTop = touch.clientY - courtRect.top - offsetY;

    // Apply the same constraints as with mouse events
    newLeft = Math.max(0, Math.min(newLeft, courtWidth - playerSize));
    newTop = Math.max(0, Math.min(newTop, courtHeight - playerSize));

    // Check constraints (simplified version)
    let canMove = true;
    // ... implement the same constraint logic as in the mousemove event

    if (canMove) {
      activePlayer.style.left = newLeft + "px";
      activePlayer.style.top = newTop + "px";
      updateConnectionLines();
    }
  });

  document.addEventListener("touchend", function () {
    if (!activePlayer) return;

    activePlayer.style.zIndex = "1";
    activePlayer = null;
    verticalLine.classList.remove("active");
    horizontalLine.classList.remove("active");

    // Clear highlights and connection lines after a short delay
    setTimeout(() => {
      clearRelatedHighlights();
      clearConnectionLines();
    }, 500);
  });
});
