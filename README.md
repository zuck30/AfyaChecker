# Afyachecker MVP Scaffold.

![Banner](https://capsule-render.vercel.app/api?type=venom&height=200&color=0:43cea2,100:185a9d&text=%20AfyaChecker&textBg=false&desc=(Chunguza+afya+yako)&descAlign=79&fontAlign=50&descAlignY=70&fontColor=f7f5f5)

<p align="center">
AfyaChecker is a web application that allows users to prompt their health symptoms in both Swahili and English and get a preliminary diagnosis and advice. The frontend is built with React and the backend is a FastAPI server that uses the ChatGPT API for analysis.
</p>

![afyachecker](https://img.shields.io/badge/React-18.2.0-blue) ![FastAPI](https://img.shields.io/badge/FastAPI-0.68.0-green) ![OpenAI API](https://img.shields.io/badge/OpenAI-API-brightgreen)


<br>
<a href="https://github.com/zuck30"> <img src="https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExbGpzbGM1ZXh4Y2VteWYza3NhbXoxamF0eWRnNnM4bHR0b3hiOWZmdSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/hSLA7QcIpsWcGeGqRi/giphy.gif" width="40%" align="right" style="border-radius:10px; animation: float 6s ease-in-out infinite;" alt="Coding GIF">
  </a>


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
    export GROQ_API_KEY='your_GROQ_API_KEY'
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



<h2> I need coffee to stay alive. Yes i'm that Dumb.</h2>
<p>
    <a href="https://www.buymeacoffee.com/zuck30" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-red.png" alt="Buy Me A Coffee" height="30px" ></a>
</p>

## License

This project is licensed under the MIT License, see the [LICENSE.md](LICENSE.md) file for details.

## Support

If you have any questions or issues, please open an issue on GitHub or contact mwalyangashadrack@gmail.com

## Enjoy!