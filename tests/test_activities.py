import uuid
import urllib.parse

from fastapi.testclient import TestClient

from src.app import app


client = TestClient(app)


def unique_email():
    return f"test-{uuid.uuid4().hex[:8]}@example.com"


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    # basic sanity check
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    email = unique_email()
    activity = "Chess Club"
    encoded_activity = urllib.parse.quote(activity, safe="")

    # signup
    res = client.post(f"/activities/{encoded_activity}/signup?email={urllib.parse.quote(email, safe='')}")
    assert res.status_code == 200

    # verify participant added
    res2 = client.get("/activities")
    assert res2.status_code == 200
    participants = res2.json()[activity]["participants"]
    assert email in participants

    # unregister
    res3 = client.delete(f"/activities/{encoded_activity}/unregister?email={urllib.parse.quote(email, safe='')}")
    assert res3.status_code == 200

    # verify removed
    res4 = client.get("/activities")
    participants2 = res4.json()[activity]["participants"]
    assert email not in participants2
