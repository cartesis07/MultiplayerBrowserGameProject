# MultiplayerBrowserGameProject

Social deduction cards game made with SocketIO, NodeJS and Express.

## Goal

If 4 objectives missed : traitors win the game

Way to win with the red family:
Player with the most powerful red card chooose another player : if he/she is a traitor, the traitors win the game, if not the allies win the game.

Way to win with the yellow family:
Everyone vote for one player (including their yellow cards power). If the player selected is a traitor, the traitors win the game, if not the allies win the game.

## Equipment

- 9 objectives cards
- influence cards (1, 2, 3, 4)
- duo cards
- voting material

## Usage

3 areas of 3 epochs
1 objective at each epoch
1 duo selected randomly
If the duo passes, vote to give the objective to someone else
If not, objective lost

Objectives powers phase

Drawing phase
