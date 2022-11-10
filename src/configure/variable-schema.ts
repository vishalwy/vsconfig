export const VariableSchema = {
  type: 'object',
  patternProperties: {
    '^[A-Z0-9_]+$': {
      type: 'object',
      properties: {
        description: {
          type: 'string'
        },
        values: {
          type: 'array',
          items: {
            type: 'string'
          }
        },
        required: {
          type: 'boolean'
        }
      },
      additionalProperties: false
    }
  },
  additionalProperties: false
};
