import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<MechanicalSymbolDetector />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
