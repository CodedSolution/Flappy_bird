import styled from "styled-components";
import { useEffect, useState, useMemo } from "react";
import { checkUserClaimed, submitScores } from "./utils/token";

/**
 * All the constant values required for the game to work.
 * By changing these values we can effect the working of the game.
 */
const BIRD_HEIGHT = 28;
const BIRD_WIDTH = 33;
const WALL_HEIGHT = 600;
const WALL_WIDTH = 400;
const GRAVITY = 8;
const OBJ_WIDTH = 52;
const OBJ_SPEED = 6;
const OBJ_GAP = 200;
const OBJ_Testing = 300;

/**
 * This function is the main component which renders all the game objects.
 * @returns None
 */
function App() {
  //Changing the game values based on the activities done in the game.
  const [isStart, setIsStart] = useState(false);
  const [birdpos, setBirdpos] = useState(300);
  const [objHeight, setObjHeight] = useState(0);
  const [objPos, setObjPos] = useState(WALL_WIDTH);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [userId, setUserId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [token, setTokenType] = useState("");
  const [exitButtonDisabled, setExitButtonDisabled] = useState(true);
  const [countdown, setCountdown] = useState(3);
  const [hasClaimed, setHasClaimed] = useState(true);
  const [tokensEarned, setTokensEarned] = useState(0);

  //Retrieve userId and accessToken
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const userIdFromUrl = queryParams.get("userId");
    const accessTokenFromUrl = queryParams.get("accessToken");
    const tokenTypeFromUrl = queryParams.get("tokenType");

    if (userIdFromUrl) {
      setUserId(userIdFromUrl);
      console.log("User ID:", userIdFromUrl);
    }

    if (accessTokenFromUrl) {
      setAccessToken(accessTokenFromUrl);
      console.log("Access Token:", accessTokenFromUrl);
    }

    if (tokenTypeFromUrl) {
      setTokenType(tokenTypeFromUrl);
      console.log("Token Type:", tokenTypeFromUrl);
    }
  }, []);

  //check if user already claimed token
  useEffect(() => {
    const checkUserClaimStatus = async () => {
      if (!accessToken || !userId) {
        console.log("Access token or user ID not available yet");
        return;
      }
      try {
        console.log(
          "Checking with accessToken:",
          accessToken,
          "and userId:",
          userId
        );
        const res = await checkUserClaimed(accessToken, userId);
        console.log("check user claimed res", res);

        // Explicitly check the value of res.message
        if (res === true) {
          setHasClaimed(true);
          console.log("has claim status: true");
        } else {
          setHasClaimed(false);
          console.log("has claim status: false");
        }
      } catch (e) {
        if (e instanceof Error) {
          console.log("Error:", e.message);
        } else {
          console.log("Cannot fetch user claimed result");
        }
      }
    };

    if (accessToken && userId) {
      checkUserClaimStatus();
    }
  }, [accessToken, userId]);

  //Handle game over and countdown timer
  useEffect(() => {
    if (gameOver) {
      console.log("has claim game over status:", hasClaimed);
      handleGameOver();
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev > 0) return prev - 1;
          clearInterval(timer);
          setExitButtonDisabled(false);
          return 0;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else {
      setExitButtonDisabled(true);
      setCountdown(3);
    }
  }, [gameOver]);

  //Submit score if user hasn't claimed tokens
  const handleGameOver = async () => {
    try {
      // Use claimStatus directly instead of relying on setHasClaimed()
      if (hasClaimed === true) {
        console.log("User has already claimed, skipping score submission.");
      } else {
        // If the user hasn't claimed, submit the score
        const points = score;
        setTokensEarned(points);

        console.log("Submitting score as the user has not claimed before...");
        const submitRes = await submitScores(
          accessToken,
          userId,
          token,
          points
        );
        console.log("Submit score response:", submitRes);
      }
    } catch (e) {
      console.log(
        "Error during game over handling or checking claim status:",
        e
      );
    }
  };

  //Reset game state when replaying
  useEffect(() => {
    setIsStart(false);
    setGameOver(false);
    setBirdpos(300);
    setObjPos(WALL_WIDTH);
    setScore(0);
    setCountdown(3);
    setExitButtonDisabled(true);
  }, []);

  //End the game when the player hits the bottom of the screen.
  useEffect(() => {
    if (!isStart) return;

    let intVal;
    if (isStart && birdpos < WALL_HEIGHT - BIRD_HEIGHT) {
      intVal = setInterval(() => {
        setBirdpos((birdpos) => birdpos + GRAVITY);
      }, 24);
    } else {
      setIsStart(false);
      // setBirdpos(300);
      // setScore(0);
      setGameOver(true);
    }
    return () => clearInterval(intVal);
  }, [isStart, birdpos]);

  //Generating the pipes(obstacles) for the game.
  useEffect(() => {
    let objval;
    if (isStart && objPos >= -OBJ_WIDTH) {
      objval = setInterval(() => {
        setObjPos((objPos) => objPos - OBJ_SPEED);
      }, 50);

      return () => {
        clearInterval(objval);
      };
    } else {
      setObjPos(WALL_WIDTH);
      setObjHeight(Math.floor(Math.random() * (WALL_HEIGHT - OBJ_GAP)));
      if (isStart) setScore((score) => score + 1);
    }
  }, [isStart, objPos]);

  //Ends the game of the player hits one of the obstacles.
  useEffect(() => {
    if (!isStart) return;

    let topObj = birdpos >= 0 && birdpos < objHeight;
    let bottomObj =
      birdpos <= WALL_HEIGHT &&
      birdpos >=
        WALL_HEIGHT - (WALL_HEIGHT - OBJ_GAP - objHeight) - BIRD_HEIGHT;

    if (
      objPos >= OBJ_WIDTH &&
      objPos <= OBJ_WIDTH + 80 &&
      (topObj || bottomObj)
    ) {
      setIsStart(false);
      // setBirdpos(300);
      // setScore(0);
      setGameOver(true);
    }
  }, [isStart, birdpos, objHeight, objPos]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.code === "Space") {
        setIsStart(true);
        setBirdpos((prev) => prev - 30);
      }
    };

    window.addEventListener("keypress", handleKeyPress);

    return () => {
      window.removeEventListener("keypress", handleKeyPress);
    };
  }, [isStart, gameOver]); // Add isStart and birdpos to the dependency list

  //Handles the player movements.
  const handler = () => {
    if (!isStart) setIsStart(true);
    else if (birdpos < BIRD_HEIGHT) setBirdpos(0);
    else setBirdpos((birdpos) => birdpos - 50);
  };

  //Handles play again
  const handlePlayAgain = () => {
    setIsStart(false);
    setBirdpos(300);
    setObjPos(WALL_WIDTH);
    setScore(0);
    setGameOver(false); // Reset game over state
  };

  const handleKeyDown = (event) => {
    // Check if the pressed key is the spacebar
    if (event.key === " " || event.key === "Spacebar") {
      // Prevent the default behavior to avoid scrolling the page
      event.preventDefault();

      // Trigger the click event
      handler();
    }
  };

  const handleExit = () => {
    window.history.back(); // Go back to the previous page
  };

  const handleBackClick = () => {
    window.history.back(); // Go back to the previous page
  };

  const backgroundUrl = useMemo(
    () => `./images/background-day.png?v=${Date.now()}`,
    []
  );
  const birdUrl = useMemo(
    () => `./images/yellowbird-upflap.png?v=${Date.now()}`,
    []
  );
  const pipeUrl = useMemo(() => `./images/pipe-green.png?v=${Date.now()}`, []);

  return (
    //Whole body of the game.
    <Home onClick={handler} onKeyDown={handleKeyDown} tabIndex="0">
      <ScoreShow>Score: {score}</ScoreShow>
      <Background url={backgroundUrl} height={WALL_HEIGHT} width={WALL_WIDTH}>
        {!isStart && !gameOver ? <Startboard>Click To Start</Startboard> : null}
        <Obj
          url={pipeUrl}
          height={objHeight}
          width={OBJ_WIDTH}
          left={objPos}
          top={0}
          deg={180}
        />
        <Bird
          url={birdUrl}
          height={BIRD_HEIGHT}
          width={BIRD_WIDTH}
          top={birdpos}
          left={100}
        />
        <Obj
          url={pipeUrl}
          height={WALL_HEIGHT - OBJ_GAP - objHeight}
          width={OBJ_WIDTH}
          left={objPos}
          top={WALL_HEIGHT - (objHeight + (WALL_HEIGHT - OBJ_GAP - objHeight))}
          deg={0}
        />
      </Background>
      <BackButton onClick={handleBackClick}>Back</BackButton>

      {gameOver && (
        <GameOverModal>
          <ScorePanel>
            <GameOverText>Game Over!</GameOverText>
            <ScoreText>Your Score: {score}</ScoreText>
            <TokenText>
              {hasClaimed
                ? "You have already claimed your tokens."
                : `You earned ${tokensEarned} tokens!`}
            </TokenText>
          </ScorePanel>
          <ButtonContainer>
            <ModalButton onClick={handleExit} disabled={exitButtonDisabled}>
              Exit {exitButtonDisabled && `(${countdown})`}
            </ModalButton>
          </ButtonContainer>
        </GameOverModal>
      )}
    </Home>
  );
}

export default App;

//All the stylesheets required for the game.
const Home = styled.div`
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  flexdirection: "column";
`;

const Background = styled.div`
  background-image: url(${(props) => props.url});
  background-repeat: no-repeat;
  background-size: ${(props) => props.width}px ${(props) => props.height}px;
  width: ${(props) => props.width}px;
  height: ${(props) => props.height}px;
  position: relative;
  overflow: hidden;
  border: 2px solid black;
`;

const Bird = styled.div`
  position: absolute;
  background-image: url(${(props) => props.url});
  background-repeat: no-repeat;
  background-size: ${(props) => props.width}px ${(props) => props.height}px;
  width: ${(props) => props.width}px;
  height: ${(props) => props.height}px;
  top: ${(props) => props.top}px;
  left: ${(props) => props.left}px;
`;

const Obj = styled.div`
  position: relative;
  background-image: url(${(props) => props.url});
  width: ${(props) => props.width}px;
  height: ${(props) => props.height}px;
  left: ${(props) => props.left}px;
  top: ${(props) => props.top}px;
  transform: rotate(${(props) => props.deg}deg);
`;

const Startboard = styled.div`
  position: relative;
  top: 49%;
  background-color: black;
  padding: 10px;
  width: 100px;
  left: 50%;
  margin-left: -50px;
  text-align: center;
  font-size: 20px;
  border-radius: 10px;
  color: #fff;
  font-weight: 600;
`;

const ScoreShow = styled.div`
  position: absolute;
  top: 10%;
  left: 47%;
  z-index: 1;
  font-weight: bold;
  font-size: 30px;
`;

const BackButton = styled.button`
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 8px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 16px;
  cursor: pointer;
  z-index: 10;

  &:hover {
    background-color: #0056b3;
  }
`;

const GameOverModal = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  z-index: 20;
`;

const ScorePanel = styled.div`
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-around;
`;

const ModalButton = styled.button`
  padding: 10px 20px;
  font-size: 18px;
  border: none;
  background-color: ${(props) => (props.disabled ? "#cccccc" : "#007bff")};
  color: white;
  border-radius: 5px;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};

  &:hover {
    background-color: ${(props) => (props.disabled ? "#cccccc" : "#0056b3")};
  }
`;

const GameOverText = styled.div`
  font-size: 26px;
  margin-bottom: 10px;
`;

const ScoreText = styled.div`
  font-size: 20px;
  margin-bottom: 10px;
`;

const TokenText = styled.div`
  font-size: 12px;
`;
