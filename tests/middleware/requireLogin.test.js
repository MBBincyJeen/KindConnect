const { requireLogin } = require("../../middleware/requireLogin");

describe("requireLogin", () => {
  it("redirects to /login if no session user (HTML request)", () => {
    const req = { session: {}, accepts: () => "html" };
    const res = { redirect: jest.fn() };
    const next = jest.fn();
    requireLogin(req, res, next);
    expect(res.redirect).toHaveBeenCalledWith("/login");
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 JSON for API calls without session", () => {
    const req = { session: {}, accepts: () => false };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    requireLogin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Authentication required" });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next if session user exists", () => {
    const req = { session: { user: { id: "123" } } };
    const res = {};
    const next = jest.fn();
    requireLogin(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
