# Voice Banking Assistant

An AI-powered banking assistant that enables users to perform secure financial operations through a natural voice and chat interface. This project leverages **Google Gemini** for natural language understanding and the **Teller API** for real-time banking data.

## Features

-   **Natural Language Interface**: Chat or speak to the assistant to check balances, view transactions, and make payments.
-   **Real-Time Banking Data**: Securely connects to bank accounts using the Teller API.
-   **Voice Interaction**: Hands-free operation with voice-to-text and text-to-voice capabilities.
-   **Smart Payment Simulation**: A safe environment to simulate payments with real-time balance tracking.
-   **Interactive Dashboard**: A modern, responsive dashboard to view financial summaries.

## Technology Stack

### Backend
-   **Python 3.8+**
-   **Flask**: REST API server.
-   **Google Gemini AI**: For intent detection and natural conversation.
-   **Teller API**: For accessing banking data (Accounts, Balances, Transactions).

### Frontend
-   **React 18**: UI library.
-   **Vite**: Build tool.
-   **TypeScript**: Type safety.
-   **Tailwind CSS**: Styling.
-   **Lucide React**: Icons.

## Prerequisites

Before you begin, ensure you have the following:

-   **Python 3.8+** installed.
-   **Node.js & npm** installed.
-   **Teller API Credentials**: You need a valid Teller certificate and private key.
-   **Google Gemini API Key**: Get one from [Google AI Studio](https://aistudio.google.com/).

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-directory>
```

### 2. Backend Setup

Navigate to the `Backend` directory:

```bash
cd Backend
```

Create a virtual environment (optional but recommended):

```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```
*(Note: If `requirements.txt` is missing, install manually: `pip install flask flask-cors httpx google-generativeai python-dotenv`)*

**Configuration**:
Create a `.env` file in the `Backend` directory with the following keys:

```env
TELLER_TOKEN=your_teller_token
TELLER_CERT=path/to/certificate.pem
TELLER_KEY=path/to/private_key.pem
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Frontend Setup

Navigate to the `Frontend` directory:

```bash
cd ../Frontend
```

Install dependencies:

```bash
npm install
```

## Running the Application

### Start the Backend Server

In the `Backend` directory:

```bash
python banking_assistant.py
```
The server will start at `http://localhost:5000`.

### Start the Frontend Application

In the `Frontend` directory:

```bash
npm run dev
```
The application will be available at `http://localhost:5173`.

## Usage

1.  Open the application in your browser.
2.  Click **"Voice Chat"** to start interacting with the assistant.
3.  **Try these commands**:
    -   "What is my balance?"
    -   "Show my recent transactions"
    -   "Who can I pay?"
    -   "Pay [Name] $50"
    -   "Show my payment history"

## Project Structure

-   **Backend/**: Contains the Flask application (`banking_assistant.py`) and API logic.
-   **Frontend/**: Contains the React application source code (`src/`), components, and styles.

## License

[MIT License](LICENSE)
