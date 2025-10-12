import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/Swahili Health Symptom Checker/i);
  expect(linkElement).toBeInTheDocument();
});
