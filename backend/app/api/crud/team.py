from sqlalchemy.orm import Session
from app.models.team import Team
from app.models.area import Area
from app.schemas.team import TeamCreate, TeamUpdate


def create_team(db: Session, team: TeamCreate):
    # If the area is provided, handle it
    if team.area:
        # Check if the area already exists in the database
        db_area = db.query(Area).filter_by(id=team.area.id).first()

        # If the area doesn't exist, create it
        if not db_area:
            db_area = Area(id=team.area.id, name=team.area.name, code=team.area.code, flag=str(team.area.flag))
            db.add(db_area)
            db.commit()
            db.refresh(db_area)

        # Create the team and associate it with the area
        db_team = Team(name=team.name, emblem=team.emblem, data_id=team.data_id, area_id=db_area.id)
    else:
        # Create the team without an area
        db_team = Team(name=team.name, emblem=team.emblem, data_id=team.data_id)

    db.add(db_team)
    db.commit()
    db.refresh(db_team)

    return db_team


def get_team(db: Session, team_id: int):
    return db.query(Team).filter(Team.id == team_id).first()


def get_teams(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Team).offset(skip).limit(limit).all()


def update_team(db: Session, team_id: int, team: TeamUpdate):
    db_team = get_team(db, team_id)
    if db_team:
        for key, value in team.model_dump(exclude_unset=True).items():
            setattr(db_team, key, value)
        db.commit()
        db.refresh(db_team)
    return db_team


def delete_team(db: Session, team_id: int):
    db_team = get_team(db, team_id)
    if db_team:
        db.delete(db_team)
        db.commit()
    return db_team
