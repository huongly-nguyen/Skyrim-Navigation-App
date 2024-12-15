import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import axios from 'axios';
import App from './App';

jest.mock('axios');

describe('App', () => {
  beforeEach(() => {
    axios.get.mockResolvedValueOnce({
      data: {
        cities: ['City1', 'City2', 'City3'],
        connections: [['City1', 'City2'], ['City2', 'City3']]
      }
    });
  });

  test('renders the title', () => {
    render(<App />);
    expect(screen.getByText('Skyrim Navigation Map')).toBeInTheDocument();
  });

  test('renders the RouteSelector component', async () => {
    render(<App />);
    expect(screen.getByTestId('route-selector')).toBeInTheDocument();
  });

  test('renders the MapDisplay component', async () => {
    render(<App />);
    expect(screen.getByTestId('map-display')).toBeInTheDocument();
  });

  test('updates selected cities on city select', async () => {
    render(<App />);
    fireEvent.click(screen.getByText('City1'));
    expect(screen.getByTestId('selected-city1')).toHaveTextContent('City1');
    fireEvent.click(screen.getByText('City2'));
    expect(screen.getByTestId('selected-city2')).toHaveTextContent('City2');
  });

  test('updates route on selection change', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        route: ['City1', 'City2', 'City3']
      }
    });

    render(<App />);
    fireEvent.click(screen.getByText('City1'));
    fireEvent.click(screen.getByText('City2'));

    expect(axios.post).toHaveBeenCalledWith('https://api.group1.proxy.devops-pse.users.h-da.cloud/route', {
      start_city: 'City1',
      end_city: 'City2'
    });

    await screen.findByTestId('route');
    expect(screen.getByTestId('route')).toHaveTextContent('City1 -> City2 -> City3');
  });
});