# Swahili Health Symptom Checker

This project is a web application that allows users to enter health symptoms in Swahili and get a preliminary diagnosis and advice. The frontend is built with React and the backend is a FastAPI server that uses the ChatGPT API for analysis.

## Project Structure

- `frontend/`: Contains the React application.
- `backend/`: Contains the FastAPI backend.

## Setup and Installation

### Backend

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install the required Python packages:
    ```bash
    pip install -r requirements.txt
    ```
3.  Set your OpenAI API key as an environment variable:
    ```bash
    export OPENAI_API_KEY='your_openai_api_key'
    ```
4.  Run the backend server:
    ```bash
    uvicorn main:app --host 127.0.0.1 --port 8000
    ```

### Frontend

1.  Navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install the required npm packages:
    ```bash
    npm install
    ```
3.  Start the React development server:
    ```bash
    npm start
    ```

## Usage

1.  Open your web browser and navigate to `http://localhost:3000`.
2.  Enter your symptoms in the text area and select your language.
3.  Click the "Analyze Symptoms" button to get the analysis.
