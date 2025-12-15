const { validationResult } = require('express-validator');

const validate = (rules = []) => {
  return async (req, res, next) => {
    try {
      // run all validations
      await Promise.all(rules.map((rule) => rule.run(req)));

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array().map((e) => ({
            field: e.path || e.param,
            message: e.msg,
          })),
        });
      }

      return next();
    } catch (err) {
      console.error('Validation middleware error:', err);
      return res.status(500).json({ message: 'Validation failed unexpectedly' });
    }
  };
};

module.exports = { validate };