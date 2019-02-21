###
# This is a simple load test script to perform deeper tests of the app
# and underlying tech stack.
#
# See: https://locust.io/
#
# Usage:
# - python3 -m pip install locustio
# - locust -H http://localhost:3000 (see docs above for more options)
###
import json
from locust import HttpLocust, TaskSet, task

auth_token = ""

class UserBehavior(TaskSet):
    def on_start(self):
        """ on_start is called when a Locust start before any task is scheduled """
        self.login()

    def on_stop(self):
        """ on_stop is called when the TaskSet is stopping """
        self.logout()

    def login(self):
        global auth_token

        # log in if auth token not set yet
        if auth_token == "":
          payload = {"email": "admin@example.com", "password": "changeme"}
          headers = {"Content-Type": "application/json"}

          login_response = self.client.post("/login", data=json.dumps(payload), headers=headers)
          print( "Login response: {}".format(login_response.json()) )
          auth_token = login_response.json()["data"]["token"]
          print( "Token: {}".format(auth_token) )

    def logout(self):
        global auth_token

        # log out if there is an auth token
        if auth_token != "":
          self.client.post("/logout", headers={"Authorization": "Bearer {}".format(auth_token)})
          auth_token = ""

    @task(2)
    def health(self):
        # no database interaction just app server
        self.client.get("/healthz")

    @task(1)
    def users(self):
        """
        Test hits all key elements of stack
        auth lookup of token in Redis
        users query in Postgres
        log read activity in Elasticsearch
        """
        self.client.get("/users", headers={"Authorization": "Bearer {}".format(auth_token)})

class ApiUser(HttpLocust):
    task_set = UserBehavior
    # wait times simulating how long a user might wait between tasks (impatient)
    min_wait = 1000
    max_wait = 5000
