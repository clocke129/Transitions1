# Transitions App

## Purpose
The Transitions app helps users manage and stay accountable during breaks by planning and tracking tasks, reducing wasted time, and providing insights into how transitions are used.

## Scope
- **Dynamic Transition Cards**: 
  - Each transition is represented by a card, which serves as a task list for that break.
  - Users can add generic tasks, predefined tasks, and trap tasks to each card.
  
- **Task Management**:
  - Tasks can be added to the current transition card.
  - Users can move tasks between different transition cards.
  - Tasks can be deleted or edited from any card.

- **Templates for Transition Cards**:
  - Users can create templates for common transitions (e.g., "Morning Routine").
  - Templates can be loaded into a new card but remain independent after being loaded.

- **Statistics Tracking**:
  - The app tracks total time spent on transitions and the number of transitions completed.
  - Users can view metrics such as tasks completed and traps avoided.

- **End-of-Day Functionality**:
  - At the end of the day, the current transition card is archived and moved to a separate tab.
  - Any tasks not completed in the "Today" list are moved to the "Queue" list at the end of the day.

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/transitions.git
   ```
2. Navigate to the project directory:
   ```bash
   cd transitions
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Usage
1. Start the development server:
   ```bash
   npm start
   ```
2. Open the app in your browser or mobile device.

## Contributing
Feel free to submit issues or pull requests to improve the app!

## License
This project is licensed under the MIT License.