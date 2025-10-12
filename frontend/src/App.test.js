import { render, screen } from '@testing-library/react';
import App from './App';

test('renders welcome message', () => {
  render(<App />);
  const linkElement = screen.getByText(/Karibu kwa AfyaChecker/i);
  expect(linkElement).toBeInTheDocument();
});
