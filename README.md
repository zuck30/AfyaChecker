# Afyachecker

![Banner](https://capsule-render.vercel.app/api?type=venom&height=200&color=0:43cea2,100:185a9d&text=%20AfyaChecker&textBg=false&desc=(Chunguza+afya+yako)&descAlign=79&fontAlign=50&descAlignY=70&fontColor=f7f5f5)

<p align="center">
This project is a web application that allows users to enter health symptoms in Swahili and get a preliminary diagnosis and advice. The frontend is built with React and the backend is a FastAPI server that uses the ChatGPT API for analysis.
</p>

![afyachecker](https://img.shields.io/badge/React-18.2.0-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.68.0-green) ![OpenAI API](https://img.shields.io/badge/OpenAI-API-brightgreen)





<h2 id=lang>Tech Stack</h2>

**Frontend**

![technologies](https://skillicons.dev/icons?i=react,js,html,css&perline=10)

**Backend**

![technologies](https://skillicons.dev/icons?i=python,fastapi&perline=10)

**Tools & Platforms**

![technologies](https://skillicons.dev/icons?i=github,vscode&perline=10)


<h2> Quick Start</h2>

### Prerequisites

- Python 3.8+
- Node.js 14+
- OpenAI Developer Account

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
2.  Interact with an AI.
