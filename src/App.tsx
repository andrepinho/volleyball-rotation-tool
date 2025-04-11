import React, { useRef, useState } from "react";

export default function App() {
  const courtPositions = [4, 3, 2, 5, 6, 1];

  // Player data with positions and initials
  const initialPlayers = [
    { id: 0, position: 1, initials: "LV", color: "bg-blue-500" },
    { id: 1, position: 2, initials: "PO", color: "bg-green-500" },
    { id: 2, position: 3, initials: "CE", color: "bg-red-500" },
    { id: 3, position: 4, initials: "OP", color: "bg-purple-500" },
    { id: 4, position: 5, initials: "PO", color: "bg-yellow-500" },
    { id: 5, position: 6, initials: "LB", color: "bg-pink-500" },
  ];

  // Initialize player positions with better distribution
  const [players, setPlayers] = useState(() => {
    return initialPlayers.map((player) => ({
      ...player,
      // Keep track of the current player position
      currentPosition: player.position,
    }));
  });

  // Calculate position coordinates based on court grid
  const getPositionCoordinates = (position, courtWidth, courtHeight) => {
    // Find position index in courtPositions
    const posIndex = courtPositions.indexOf(position);
    const col = posIndex % 3;
    const row = Math.floor(posIndex / 3);

    // Calculate actual pixel values with better margins
    return {
      x: col * (courtWidth / 3) + courtWidth / 6 - 24, // Center in cell
      y: (row * (courtHeight / 2) + courtHeight / 4 - 24) * 2, // Center in cell
    };
  };

  const [playerCoordinates, setPlayerCoordinates] = useState({});
  const [activePlayer, setActivePlayer] = useState<number | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const courtRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const [blockingPlayer, setBlockingPlayer] = useState<number | null>(null);
  const [blockDirection, setBlockDirection] = useState<string>("");

  // Update player coordinates when the court size changes or players change
  React.useEffect(() => {
    if (courtRef.current) {
      const court = courtRef.current.getBoundingClientRect();
      const courtWidth = court.width;
      const courtHeight = court.height / 2; // Only the bottom half is the court

      const newCoordinates = {};
      players.forEach((player) => {
        const posCoords = getPositionCoordinates(
          player.currentPosition,
          courtWidth,
          courtHeight
        );
        newCoordinates[player.id] = posCoords;
      });

      setPlayerCoordinates(newCoordinates);
    }
  }, [players, courtRef.current?.offsetWidth, courtRef.current?.offsetHeight]);

  // Define player relationships
  const playerRelationships = {
    4: [5, 3],
    3: [6, 4, 2],
    2: [1, 3],
    5: [4, 6],
    6: [3, 5, 1],
    1: [2, 6],
  };

  // Check position constraints
  function checkPositionConstraints(newCenterX, newCenterY) {
    if (activePlayer === null) return { canMove: true };

    let canMove = true;
    let blockingPlayer: number | null = null;
    let blockDirection = "";

    // Get active player position number
    const activePosition = players.find(
      (p) => p.id === activePlayer
    )?.currentPosition;

    // Check constraints between players
    players.forEach((otherPlayer) => {
      if (otherPlayer.id === activePlayer) return;

      const otherPos = playerCoordinates[otherPlayer.id];
      const otherPosition = otherPlayer.currentPosition;

      // Check position constraints based on volleyball rules
      switch (activePosition) {
        case 4:
          if (otherPosition === 5 && newCenterY > otherPos.y) {
            canMove = false;
            blockingPlayer = otherPlayer.id;
            blockDirection = "horizontal";
          } else if (otherPosition === 3 && newCenterX > otherPos.x) {
            canMove = false;
            blockingPlayer = otherPlayer.id;
            blockDirection = "vertical";
          }
          break;
        case 3:
          if (otherPosition === 6 && newCenterY > otherPos.y) {
            canMove = false;
            blockingPlayer = otherPlayer.id;
            blockDirection = "horizontal";
          } else if (otherPosition === 4 && newCenterX < otherPos.x) {
            canMove = false;
            blockingPlayer = otherPlayer.id;
            blockDirection = "vertical";
          } else if (otherPosition === 2 && newCenterX > otherPos.x) {
            canMove = false;
            blockingPlayer = otherPlayer.id;
            blockDirection = "vertical";
          }
          break;
        case 2:
          if (otherPosition === 1 && newCenterY > otherPos.y) {
            canMove = false;
            blockingPlayer = otherPlayer.id;
            blockDirection = "horizontal";
          } else if (otherPosition === 3 && newCenterX < otherPos.x) {
            canMove = false;
            blockingPlayer = otherPlayer.id;
            blockDirection = "vertical";
          }
          break;
        case 5:
          if (otherPosition === 4 && newCenterY < otherPos.y) {
            canMove = false;
            blockingPlayer = otherPlayer.id;
            blockDirection = "horizontal";
          } else if (otherPosition === 6 && newCenterX > otherPos.x) {
            canMove = false;
            blockingPlayer = otherPlayer.id;
            blockDirection = "vertical";
          }
          break;
        case 6:
          if (otherPosition === 3 && newCenterY < otherPos.y) {
            canMove = false;
            blockingPlayer = otherPlayer.id;
            blockDirection = "horizontal";
          } else if (otherPosition === 5 && newCenterX < otherPos.x) {
            canMove = false;
            blockingPlayer = otherPlayer.id;
            blockDirection = "vertical";
          } else if (otherPosition === 1 && newCenterX > otherPos.x) {
            canMove = false;
            blockingPlayer = otherPlayer.id;
            blockDirection = "vertical";
          }
          break;
        case 1:
          if (otherPosition === 2 && newCenterY < otherPos.y) {
            canMove = false;
            blockingPlayer = otherPlayer.id;
            blockDirection = "horizontal";
          } else if (otherPosition === 6 && newCenterX < otherPos.x) {
            canMove = false;
            blockingPlayer = otherPlayer.id;
            blockDirection = "vertical";
          }
          break;
      }
    });

    setBlockingPlayer(blockingPlayer);
    setBlockDirection(blockDirection);

    return { canMove };
  }

  function handlePlayerMouseDown(
    e: React.MouseEvent<HTMLDivElement>,
    playerId: number
  ) {
    e.preventDefault();
    e.stopPropagation();

    if (isRotating) return; // Prevent dragging during rotation

    // Calculate offset from mouse position to element position
    const playerElement = e.currentTarget;
    const rect = playerElement.getBoundingClientRect();
    dragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    setActivePlayer(playerId);
  }

  function handlePlayerTouchStart(
    e: React.TouchEvent<HTMLDivElement>,
    playerId: number
  ) {
    if (isRotating) return; // Prevent dragging during rotation

    // Calculate offset from mouse position to element position
    const playerElement = e.currentTarget;
    const rect = playerElement.getBoundingClientRect();
    dragOffsetRef.current = {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top,
    };

    setActivePlayer(playerId);
  }

  // Update mouse move handler
  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (activePlayer === null || isRotating) return;

    const courtRect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - courtRect.left - dragOffsetRef.current.x;
    const y = e.clientY - courtRect.top - dragOffsetRef.current.y;

    const playerSize = 48; // Width of player element
    const maxX = courtRect.width - playerSize;
    const maxY = courtRect.height - playerSize;

    // Check movement constraints
    const { canMove } = checkPositionConstraints(x, y);

    // Allow dragging even if blocked, but only update position if canMove is true
    if (canMove || (blockingPlayer === activePlayer)) {
      setPlayerCoordinates((prev) => ({
        ...prev,
        [activePlayer]: {
          x: Math.max(0, Math.min(x, maxX)),
          y: Math.max(0, Math.min(y, maxY)),
        },
      }));
    }
  }

  // Update touch move handler
  function handleTouchMove(e: React.TouchEvent<HTMLDivElement>) {
    if (activePlayer === null || isRotating) return;

    const courtRect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - courtRect.left - dragOffsetRef.current.x;
    const y = touch.clientY - courtRect.top - dragOffsetRef.current.y;

    const playerSize = 48; // Width of player element
    const maxX = courtRect.width - playerSize;
    const maxY = courtRect.height - playerSize;

    // Check movement constraints
    const { canMove } = checkPositionConstraints(x, y);

    // Allow dragging even if blocked, but only update position if canMove is true
    if (canMove || (blockingPlayer === activePlayer)) {
      setPlayerCoordinates((prev) => ({
        ...prev,
        [activePlayer]: {
          x: Math.max(0, Math.min(x, maxX)),
          y: Math.max(0, Math.min(y, maxY)),
        },
      }));
    }
  }

  function handleMouseUp() {
    setActivePlayer(null);
  }

  // Handle player rotation
  function rotatePositions() {
    if (isRotating) return;

    setIsRotating(true);

    // Rotate positions (clockwise)
    const newPlayers = players.map((player) => {
      // Volleyball rotation rules: 1->6->5->4->3->2->1
      const nextPositionByCurrentPosition = {
        1: 6,
        2: 1,
        3: 2,
        4: 3,
        5: 4,
        6: 5,
      };

      return {
        ...player,
        currentPosition: nextPositionByCurrentPosition[player.currentPosition],
      };
    });

    setPlayers(newPlayers);

    // End rotation animation after 1 second
    setTimeout(() => {
      setIsRotating(false);
    }, 700);
  }

  function resetPositions() {
    setPlayers(
      initialPlayers.map((player) => ({
        ...player,
        // Keep track of the current player position
        currentPosition: player.position,
      }))
    );
    setIsRotating(true);

    setTimeout(() => {
      setIsRotating(false);
    }, 500);
  }

  return (
    <div className="m-auto bg-radial from-sky-500 from-40% bg-sky-950">
      <div className="p-12 flex items-center justify-center">
        <div className="h-[90vh] aspect-1/2 rounded-2xl">
          <div className="bg-amber-600 flex grow flex-col h-full border-4 text-white">
            <div className="h-1/2 border-b-4 relative">
              <div className="h-full flex flex-col justify-between p-6">
                <div>
                  <h1 className="text-3xl mb-4">Learn 5x1 rotation</h1>
                  <p>
                    <strong>Instructions:</strong> Drag to move players.
                  </p>
                  <ul className="space-y-1 mt-2">
                    <li>
                      - Each player's movement is limited by their relative
                      neighbors
                    </li>
                    <li>
                      - Players cannot cross their teammates' relative positions
                    </li>
                  </ul>
                </div>

                <div className="flex gap-2 justify-around">
                  <button
                    onClick={rotatePositions}
                    disabled={isRotating}
                    className={`mt-4 px-4 py-2 bg-blue-700 rounded-lg hover:bg-blue-600
                    transition-colors ${
                      isRotating ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    Rotate
                  </button>

                  <button
                    onClick={resetPositions}
                    disabled={isRotating}
                    className={`mt-4 px-4 py-2 bg-blue-700 rounded-lg hover:bg-blue-600
                    transition-colors ${
                      isRotating ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            <div
              ref={courtRef}
              className="h-1/2 relative"
              onMouseMove={handleMouseMove}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleMouseUp}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div className="relative h-1/3 border-b-4 border-white">
                <div className="absolute w-[130%] left-[-15%] bottom-[-4px] border-b-4 border-white border-dotted" />
              </div>
              <div className="w-full h-full opacity-30 absolute top-0 grid grid-cols-3 grid-rows-2">
                {courtPositions.map((positionNumber) => (
                  <div
                    key={positionNumber}
                    className="border text-center flex items-end justify-center p-4 text-2xl "
                  >
                    <div
                      className={`flex items-center justify-center rounded-full px-3 py-1 transition-colors ${
                        players.find(
                          (p) => p.currentPosition === positionNumber
                        )?.color
                      }`}
                    >
                      {positionNumber}
                    </div>
                  </div>
                ))}
              </div>

              {/* Render blocking lines */}
              {blockingPlayer !== null && (
                <>
                  {blockDirection === "horizontal" && (
                    <div
                      className="absolute border-t-2 border-red-500"
                      style={{
                        top: playerCoordinates[blockingPlayer]?.y + 24 + "px", // Adjust position
                        left: 0,
                        right: 0,
                      }}
                    />
                  )}
                  {blockDirection === "vertical" && (
                    <div
                      className="absolute border-l-2 border-red-500"
                      style={{
                        left: playerCoordinates[blockingPlayer]?.x + 24 + "px", // Adjust position
                        top: 0,
                        bottom: 0,
                      }}
                    />
                  )}
                </>
              )}

              <div className="w-full h-full top-0 absolute">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className={`w-12 h-12 ${
                      player.color
                    } rounded-full flex justify-center items-center text-white font-bold shadow-md opacity-85 ${
                      activePlayer === player.id
                        ? "cursor-grabbing z-10"
                        : "cursor-grab z-0"
                    } ${isRotating ? "scale-110" : ""} ${
                      blockingPlayer === player.id ? "animate-bounce" : ""
                    }`}
                    style={{
                      position: "absolute",
                      left: `${playerCoordinates[player.id]?.x}px`,
                      top: `${playerCoordinates[player.id]?.y}px`,
                      transition:
                        isRotating || activePlayer !== player.id
                          ? "all 0.5s ease"
                          : "none",
                      touchAction: "none",
                      userSelect: "none",
                    }}
                    onMouseDown={(e) => handlePlayerMouseDown(e, player.id)}
                    onTouchStart={(e) => handlePlayerTouchStart(e, player.id)}
                  >
                    {player.initials}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
