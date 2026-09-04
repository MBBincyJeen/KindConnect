const { errorHandler } = require("../../middleware/errorHandler");

describe("errorHandler", () => {
  it("returns 500 for generic errors (JSON)", () => {
    const req = { accepts: () => false };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const err = new Error("Something broke");
    errorHandler(err, req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Something broke" });
  });

  it("returns 500 for generic errors (HTML)", () => {
    const req = { accepts: () => "html" };
    const res = { status: jest.fn().mockReturnThis(), render: jest.fn() };
    const err = new Error("Something broke");
    errorHandler(err, req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.render).toHaveBeenCalledWith("error", { message: "Something broke" });
  });

  it("returns 413 for file size errors", () => {
    const req = { accepts: () => false };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const err = new Error("File too large");
    err.code = "LIMIT_FILE_SIZE";
    errorHandler(err, req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(413);
    expect(res.json).toHaveBeenCalledWith({ error: "File too large" });
  });

  it("uses err.status if provided", () => {
    const req = { accepts: () => false };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const err = new Error("Not Found");
    err.status = 404;
    errorHandler(err, req, res, jest.fn());
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
