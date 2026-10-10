import unittest

from api.main import app


class OpenAPIDocumentationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.schema = app.openapi()

    def test_every_documented_operation_has_summary_and_description(self):
        operations = [
            operation
            for path_item in self.schema["paths"].values()
            for method, operation in path_item.items()
            if method in {"get", "post", "put", "patch", "delete"}
        ]

        self.assertGreater(len(operations), 30)
        for operation in operations:
            with self.subTest(operation=operation.get("operationId")):
                self.assertTrue(operation.get("summary"))
                self.assertTrue(operation.get("description"))

    def test_every_operation_parameter_has_a_description(self):
        for path, path_item in self.schema["paths"].items():
            for method, operation in path_item.items():
                if method not in {"get", "post", "put", "patch", "delete"}:
                    continue
                for parameter in operation.get("parameters", []):
                    with self.subTest(
                        path=path,
                        method=method,
                        parameter=parameter["name"],
                    ):
                        self.assertTrue(parameter.get("description"))

    def test_protected_operations_document_bearer_authentication(self):
        security_schemes = self.schema["components"]["securitySchemes"]
        self.assertIn("HTTPBearer", security_schemes)
        self.assertEqual(security_schemes["HTTPBearer"]["scheme"], "bearer")

        for path, method in (
            ("/contests", "post"),
            ("/teams", "get"),
            ("/submissions", "post"),
            ("/users/{user_id}", "patch"),
        ):
            with self.subTest(path=path, method=method):
                self.assertTrue(self.schema["paths"][path][method].get("security"))

    def test_request_and_response_models_include_examples(self):
        models = self.schema["components"]["schemas"]
        expected_models = {
            "ContestCreate",
            "ContestOut",
            "ProblemOut",
            "SubmissionCreate",
            "SubmissionOut",
            "TeamCreate",
            "TeamOut",
            "UserCreate",
            "UserOut",
            "LoginRequest",
            "LoginResponse",
            "SessionDetail",
        }

        for name in expected_models:
            with self.subTest(model=name):
                self.assertTrue(models[name].get("examples"))

    def test_untyped_json_endpoints_include_response_examples(self):
        expected_operations = (
            ("/health", "get"),
            ("/contests/{contest_id}/leaderboard", "get"),
            ("/aggregations/leaderboard/{contest_id}", "get"),
            ("/aggregations/avg-score-by-difficulty", "get"),
            ("/aggregations/submission-status-by-contest", "get"),
            ("/aggregations/problems-solved-per-user", "get"),
            ("/aggregations/team-performance", "get"),
        )

        for path, method in expected_operations:
            with self.subTest(path=path, method=method):
                response = self.schema["paths"][path][method]["responses"]["200"]
                self.assertIn("example", response["content"]["application/json"])


if __name__ == "__main__":
    unittest.main()
