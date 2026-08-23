const fs = require('fs');
let code = fs.readFileSync('src/pages/Diagramacion.tsx', 'utf8');

// Fix conductor principal
code = code.replace(
  `                              }}
                            />
                            );
                          })()}
                        </td>
                        {/* Conductor Principal Dropdown */}`,
  `                              }}
                            />
                            );
                          })()}
                        </td>
                        {/* Conductor Principal Dropdown */}` // Actually this one was from the first replace which was valid. Wait, no.
);

// I'll just restore the end of Select for conductors
code = code.replace(
  `                              option: (base) => ({ ...base, fontSize: '12px' })
                              }}
                            />
                            );
                          })()}
                        </td>
                        {/* 2do Conductor / Auxiliar */}`,
  `                              option: (base) => ({ ...base, fontSize: '12px' })
                            }}
                          />
                        </td>
                        {/* 2do Conductor / Auxiliar */}`
);

code = code.replace(
  `                              option: (base) => ({ ...base, fontSize: '12px' })
                              }}
                            />
                            );
                          })()}
                        </td>
                        {/* Observaciones */}`,
  `                              option: (base) => ({ ...base, fontSize: '12px' })
                            }}
                          />
                        </td>
                        {/* Observaciones */}`
);

fs.writeFileSync('src/pages/Diagramacion.tsx', code);
