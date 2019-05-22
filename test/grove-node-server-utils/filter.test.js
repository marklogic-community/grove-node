const chai = require('chai');
const expect = chai.expect;

const filter = require('../../grove-node-server-utils/filter');
const buildQuery = filter.buildQuery;

describe('filter.js', () => {
  describe('buildQuery', () => {
    it('works for empty filter object', () => {
      expect(buildQuery({})).to.deep.equal({});
    });
  });

  describe('queryText', () => {
    it('works', () => {
      const filter = {
        type: 'queryText',
        value: 'foo AND bar'
      };
      expect(buildQuery(filter)).to.deep.equal({
        qtext: 'foo AND bar'
      });
    });
  });

  describe('selection', () => {
    it('works with simple example including a negation', () => {
      const filter = {
        type: 'selection',
        constraint: 'classification',
        mode: 'or',
        value: [
          {
            not: 'mammal'
          },
          'platypus',
          'kangaroo'
        ]
      };
      expect(buildQuery(filter)).to.deep.equal({
        'or-query': {
          queries: [
            {
              'not-query': {
                'range-constraint-query': {
                  'constraint-name': 'classification',
                  'range-operator': 'EQ',
                  'range-option': [],
                  value: ['mammal']
                }
              }
            },
            {
              'range-constraint-query': {
                'constraint-name': 'classification',
                'range-operator': 'EQ',
                'range-option': [],
                value: ['platypus']
              }
            },
            {
              'range-constraint-query': {
                'constraint-name': 'classification',
                'range-operator': 'EQ',
                'range-option': [],
                value: ['kangaroo']
              }
            }
          ]
        }
      });
    });

    it('works for non-array, single value', () => {
      const filter = {
        type: 'selection',
        constraint: 'classification',
        mode: 'and',
        value: 'kangaroo'
      };
      expect(buildQuery(filter)).to.deep.equal({
        'range-constraint-query': {
          'constraint-name': 'classification',
          'range-operator': 'EQ',
          'range-option': [],
          value: ['kangaroo']
        }
      });
    });

    it('works for empty string value', () => {
      const filter = {
        type: 'selection',
        constraint: 'classification',
        mode: 'and',
        value: ''
      };
      expect(buildQuery(filter)).to.deep.equal({
        'range-constraint-query': {
          'constraint-name': 'classification',
          'range-operator': 'EQ',
          'range-option': [],
          value: ['']
        }
      });

      const filterWithArray = {
        type: 'selection',
        constraint: 'classification',
        mode: 'and',
        value: ['']
      };
      expect(buildQuery(filterWithArray)).to.deep.equal({
        'range-constraint-query': {
          'constraint-name': 'classification',
          'range-operator': 'EQ',
          'range-option': [],
          value: ['']
        }
      });
    });

    describe('geospatial', () => {
      const box = {
        north: 100,
        south: 0,
        west: 150,
        east: -150
      };
      const point = { latitude: 0, longitude: 100 };
      const circle = {
        radius: 100,
        point: { latitude: 100, longitude: 0 }
      };
      const polygon = {
        point: [
          { latitude: 0, longitude: 100 },
          { latitude: 100, longitude: 0 }
        ]
      };
      const filter = {
        type: 'selection',
        constraintType: 'geospatial',
        constraint: 'Location',
        mode: 'and',
        value: [box, point, circle, polygon]
      };
      const expectedQueries = {
        queries: [
          {
            'geospatial-constraint-query': {
              'constraint-name': 'Location',
              box: [box],
              point: [],
              circle: [],
              polygon: []
            }
          },
          {
            'geospatial-constraint-query': {
              'constraint-name': 'Location',
              box: [],
              point: [point],
              circle: [],
              polygon: []
            }
          },
          {
            'geospatial-constraint-query': {
              'constraint-name': 'Location',
              box: [],
              point: [],
              circle: [circle],
              polygon: []
            }
          },
          {
            'geospatial-constraint-query': {
              'constraint-name': 'Location',
              box: [],
              point: [],
              circle: [],
              polygon: [polygon]
            }
          }
        ]
      };
      it('works for various geospatial types, anded together', () => {
        expect(buildQuery(filter)).to.deep.equal({
          'and-query': expectedQueries
        });
      });

      it('works for various geospatial types, "or"ed together', () => {
        filter.mode = 'or';
        expect(buildQuery(filter)).to.deep.equal({
          'or-query': expectedQueries
        });
      });
    });

    describe('custom constraint', () => {
      const myValues = [{ value: 1 }, { value: 2 }];
      const filter = {
        // not sure if this type makes sense
        type: 'selection',
        constraintType: 'custom',
        constraint: 'CustomConstraint',
        // is this the right mode?
        mode: 'and',
        value: myValues
      };
      const expectedQueries = {
        queries: [
          {
            'custom-constraint-query': {
              'constraint-name': 'CustomConstraint',
              value: { value: 1 },
              operator: 'EQ'
            }
          },
          {
            'custom-constraint-query': {
              'constraint-name': 'CustomConstraint',
              value: { value: 2 },
              operator: 'EQ'
            }
          }
        ]
      };

      it('works in and mode', () => {
        expect(buildQuery(filter)).to.deep.equal({
          'and-query': expectedQueries
        });
      });

      it('works in or mode', () => {
        filter.mode = 'or';
        expect(buildQuery(filter)).to.deep.equal({
          'or-query': expectedQueries
        });
      });
    });
  });

  describe('range', () => {
    it('works with simple example', () => {
      expect(
        buildQuery({
          type: 'range',
          constraint: 'age',
          value: {
            ge: 21,
            lt: 30
          }
        })
      ).to.deep.equal({
        'and-query': {
          queries: [
            {
              'range-constraint-query': {
                'constraint-name': 'age',
                'range-operator': 'EQ',
                'range-option': [],
                value: [21]
              }
            },
            {
              'range-constraint-query': {
                'constraint-name': 'age',
                'range-operator': 'EQ',
                'range-option': [],
                value: [30]
              }
            }
          ]
        }
      });
    });

    xit('works with all other operators', () => {
      // TODO: gt, le, eq, ne
    });
  });

  describe('combined filters', () => {
    it('works for "and"', () => {
      const andFilter = {
        and: [
          {
            type: 'selection',
            constraint: 'classification',
            mode: 'or',
            value: ['kangaroo']
          },
          {
            type: 'range',
            constraint: 'age',
            value: {
              ge: 20,
              ne: 99
            }
          }
        ]
      };
      expect(buildQuery(andFilter)).to.deep.equal({
        'and-query': {
          queries: [
            {
              'range-constraint-query': {
                'constraint-name': 'classification',
                'range-operator': 'EQ',
                'range-option': [],
                value: ['kangaroo']
              }
            },
            {
              'and-query': {
                queries: [
                  {
                    'range-constraint-query': {
                      'constraint-name': 'age',
                      'range-operator': 'EQ',
                      'range-option': [],
                      value: [20]
                    }
                  },
                  {
                    'range-constraint-query': {
                      'constraint-name': 'age',
                      'range-operator': 'EQ',
                      'range-option': [],
                      value: [99]
                    }
                  }
                ]
              }
            }
          ]
        }
      });
    });

    it('works for "or"', () => {
      const orFilter = {
        or: [
          {
            type: 'selection',
            constraint: 'classification',
            mode: 'or',
            value: ['kangaroo']
          },
          {
            type: 'range',
            constraint: 'age',
            value: {
              ge: 20,
              ne: 99
            }
          }
        ]
      };
      expect(buildQuery(orFilter)).to.deep.equal({
        'or-query': {
          queries: [
            {
              'range-constraint-query': {
                'constraint-name': 'classification',
                'range-operator': 'EQ',
                'range-option': [],
                value: ['kangaroo']
              }
            },
            {
              'and-query': {
                queries: [
                  {
                    'range-constraint-query': {
                      'constraint-name': 'age',
                      'range-operator': 'EQ',
                      'range-option': [],
                      value: [20]
                    }
                  },
                  {
                    'range-constraint-query': {
                      'constraint-name': 'age',
                      'range-operator': 'EQ',
                      'range-option': [],
                      value: [99]
                    }
                  }
                ]
              }
            }
          ]
        }
      });
    });

    it('works for "not"', () => {
      const notFilter = {
        not: {
          type: 'selection',
          constraint: 'classification',
          mode: 'or',
          value: ['kangaroo']
        }
      };
      expect(buildQuery(notFilter)).to.deep.equal({
        'not-query': {
          'range-constraint-query': {
            'constraint-name': 'classification',
            'range-operator': 'EQ',
            'range-option': [],
            value: ['kangaroo']
          }
        }
      });
    });

    it('works for not empty string', () => {
      const notFilter = {
        not: {
          type: 'selection',
          constraint: 'classification',
          value: ''
        }
      };
      expect(buildQuery(notFilter)).to.deep.equal({
        'not-query': {
          'range-constraint-query': {
            'constraint-name': 'classification',
            'range-operator': 'EQ',
            'range-option': [],
            value: ['']
          }
        }
      });

      const notFilterWithArray = {
        not: {
          type: 'selection',
          constraint: 'classification',
          value: ['']
        }
      };
      expect(buildQuery(notFilterWithArray)).to.deep.equal({
        'not-query': {
          'range-constraint-query': {
            'constraint-name': 'classification',
            'range-operator': 'EQ',
            'range-option': [],
            value: ['']
          }
        }
      });
    });

    it('works for near', () => {
      const nearFilter = {
        near: {
          filters: [
            {
              type: 'queryText',
              value: 'Patrick'
            },
            {
              type: 'queryText',
              value: 'McElwee'
            }
          ],
          distance: 10
        }
      };
      expect(buildQuery(nearFilter)).to.deep.equal({
        'near-query': {
          queries: [
            { qtext: 'Patrick' },
            { qtext: 'McElwee' },
            { distance: 10 }
          ]
        }
      });
    });

    it('works for complicated example', () => {
      const combinedFilter = {
        and: [
          {
            type: 'queryText',
            value: 'foo AND bar'
          },
          {
            type: 'selection',
            constraint: 'firstName',
            value: [
              'Geert',
              {
                not: 'Patrick'
              }
            ],
            mode: 'and'
          },
          {
            type: 'selection',
            constraint: 'active',
            value: true
          },
          {
            type: 'range',
            constraint: 'age',
            value: {
              ge: 20,
              ne: 99
            }
          },
          {
            type: 'selection',
            constraint: 'eyeColor',
            value: ['blue', 'brown'],
            mode: 'or'
          },
          {
            or: [
              {
                type: 'selection',
                constraint: 'occupationCategory',
                value: 'software'
              },
              {
                and: [
                  {
                    type: 'selection',
                    constraint: 'occupationCategory',
                    value: 'IT'
                  },
                  {
                    not: {
                      type: 'selection',
                      constraint: 'occupationCategory',
                      mode: 'or',
                      value: ['marketing', 'support']
                    }
                  }
                ]
              }
            ]
          },
          {
            near: {
              filters: [
                {
                  type: 'queryText',
                  value: 'Patrick'
                },
                {
                  type: 'queryText',
                  value: 'McElwee'
                }
              ],
              distance: 10
            }
          }
        ]
      };
      expect(buildQuery(combinedFilter)).to.deep.equal({
        'and-query': {
          queries: [
            {
              qtext: 'foo AND bar'
            },
            {
              'and-query': {
                queries: [
                  {
                    'range-constraint-query': {
                      'constraint-name': 'firstName',
                      'range-operator': 'EQ',
                      'range-option': [],
                      value: ['Geert']
                    }
                  },
                  {
                    'not-query': {
                      'range-constraint-query': {
                        'constraint-name': 'firstName',
                        'range-operator': 'EQ',
                        'range-option': [],
                        value: ['Patrick']
                      }
                    }
                  }
                ]
              }
            },
            {
              'range-constraint-query': {
                'constraint-name': 'active',
                'range-operator': 'EQ',
                'range-option': [],
                value: [true]
              }
            },
            {
              'and-query': {
                queries: [
                  {
                    'range-constraint-query': {
                      'constraint-name': 'age',
                      'range-operator': 'EQ',
                      'range-option': [],
                      value: [20]
                    }
                  },
                  {
                    'range-constraint-query': {
                      'constraint-name': 'age',
                      'range-operator': 'EQ',
                      'range-option': [],
                      value: [99]
                    }
                  }
                ]
              }
            },
            {
              'or-query': {
                queries: [
                  {
                    'range-constraint-query': {
                      'constraint-name': 'eyeColor',
                      'range-operator': 'EQ',
                      'range-option': [],
                      value: ['blue']
                    }
                  },
                  {
                    'range-constraint-query': {
                      'constraint-name': 'eyeColor',
                      'range-operator': 'EQ',
                      'range-option': [],
                      value: ['brown']
                    }
                  }
                ]
              }
            },
            {
              'or-query': {
                queries: [
                  {
                    'range-constraint-query': {
                      'constraint-name': 'occupationCategory',
                      'range-operator': 'EQ',
                      'range-option': [],
                      value: ['software']
                    }
                  },
                  {
                    'and-query': {
                      queries: [
                        {
                          'range-constraint-query': {
                            'constraint-name': 'occupationCategory',
                            'range-operator': 'EQ',
                            'range-option': [],
                            value: ['IT']
                          }
                        },
                        {
                          'not-query': {
                            'or-query': {
                              queries: [
                                {
                                  'range-constraint-query': {
                                    'constraint-name': 'occupationCategory',
                                    'range-operator': 'EQ',
                                    'range-option': [],
                                    value: ['marketing']
                                  }
                                },
                                {
                                  'range-constraint-query': {
                                    'constraint-name': 'occupationCategory',
                                    'range-operator': 'EQ',
                                    'range-option': [],
                                    value: ['support']
                                  }
                                }
                              ]
                            }
                          }
                        }
                      ]
                    }
                  }
                ]
              }
            },
            {
              'near-query': {
                queries: [
                  { qtext: 'Patrick' },
                  { qtext: 'McElwee' },
                  { distance: 10 }
                ]
              }
            }
          ]
        }
      });
    });
  });
});
