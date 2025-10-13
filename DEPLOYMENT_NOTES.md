# Deployment Notes for Swahili Health Symptom Checker

This document provides instructions for deploying the frontend and backend of the Swahili Health Symptom Checker application.

## Backend Deployment (Python/FastAPI)

The backend is a Python FastAPI application and needs to be deployed to a service that supports Python applications, such as:

*   **Heroku:** [Deploying Python Applications on Heroku](https://devcenter.heroku.com/articles/deploying-python)
*   **Render:** [Deploying a Python FastAPI App on Render](https://render.com/docs/deploy-fastapi)
*   **AWS Elastic Beanstalk:** [Deploying a FastAPI application to Elastic Beanstalk](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create-deploy-python-fastapi.html)
*   **Google Cloud Run:** [Quickstart: Deploy a Python web service to Cloud Run](https://cloud.google.com/run/docs/quickstarts/build-and-deploy/python)

### Backend Environment Variables

When deploying the backend, you will need to set the following environment variable:

*   `GROQ_API_KEY`: Your API key for the OpenAI service.

## Frontend Deployment (React)

The frontend is a React application and is configured for deployment on Netlify.

### Frontend Environment Variables

When deploying the frontend on Netlify, you will need to set the following environment variable in the Netlify build settings:

*   `REACT_APP_API_URL`: The URL of your deployed backend API. For example, `https://your-backend-api-url.com`.

This will ensure that the frontend application can communicate with your deployed backend. For local development, the `proxy` in `package.json` will be used.
