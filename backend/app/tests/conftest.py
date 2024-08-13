# In conftest.py or your test file

import pytest
from unittest.mock import Mock, MagicMock
from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from ..models.tournament import Tournament
from ..models.user import User
from ..schemas.tournament import TournamentCreate, TournamentRead


@pytest.fixture
def tournament_mocker():
    # Mock database session
    mock_db = MagicMock(spec=Session)

    # Mock current user
    mock_user = Mock(spec=User)
    mock_user.is_admin = True
    mock_user.id = 1

    # Mock Tournament model
    mock_tournament = Mock(spec=Tournament)
    mock_tournament.id = 1
    mock_tournament.name = "Test Tournament"
    mock_tournament.logo = "test_logo.png"
    mock_tournament.finished = False

    # Mock database query methods
    mock_query = Mock()
    mock_filter = Mock()
    mock_first = Mock()

    mock_db.query.return_value = mock_query
    mock_query.filter.return_value = mock_filter
    mock_filter.first.return_value = None  # Default to no existing tournament

    # Mock database transaction methods
    mock_db.add.return_value = None
    mock_db.commit.return_value = None
    mock_db.refresh.return_value = None

    # Create a function to easily set up an existing tournament
    def set_existing_tournament(tournament=None):
        nonlocal mock_filter
        mock_filter.first.return_value = tournament or mock_tournament

    # Create a function to simulate database errors
    def simulate_db_error(error_type=SQLAlchemyError):
        mock_db.commit.side_effect = error_type()

    return {
        "db": mock_db,
        "user": mock_user,
        "tournament": mock_tournament,
        "set_existing_tournament": set_existing_tournament,
        "simulate_db_error": simulate_db_error,
    }