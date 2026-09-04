function emptyTutorEvaluation() {
  return {
    clarity: null,
    helpfulness: null,
    professionalism: null,
    engagement: null,
    overallRating: null,
    notes: "",
    evaluatedAt: null,
  };
}

function parseRating(value) {
  const rating = Number(value);
  return Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null;
}

function buildStudentTutorEvaluation(task, ratings) {
  if (!task.takenById) return emptyTutorEvaluation();

  const clarity = parseRating(ratings.clarity);
  const helpfulness = parseRating(ratings.helpfulness);
  const professionalism = parseRating(ratings.professionalism);
  const engagement = parseRating(ratings.engagement);
  const values = [clarity, helpfulness, professionalism, engagement];

  if (values.some((rating) => rating === null)) return null;
  const overallRating = Number(((clarity + helpfulness + professionalism + engagement) / 4).toFixed(1));

  return {
    clarity,
    helpfulness,
    professionalism,
    engagement,
    overallRating,
    notes: "Submitted by the student when marking the tutoring request complete.",
    evaluatedAt: new Date(),
  };
}

module.exports = { emptyTutorEvaluation, parseRating, buildStudentTutorEvaluation };
