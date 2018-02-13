/* global ENV, Monitoring */

import React, { Component } from 'react';

export default class extends Component {
  constructor() {
    super();
    this.state = {
      databases: [],
    };
  }

  componentDidMount() {
    this.loadSamples();
  }

  loadSamples = () => {
    this.setState({ databases: ENV.generateData().toArray() });
    Monitoring.renderRate.ping();
    setTimeout(this.loadSamples, ENV.timeout);
  }

  render() {
    return (
      <table className="table table-striped latest-data">
        <tbody>
          {
            this.state.databases.map(database => (
              <tr key={database.dbname}>
                <td className="dbname">
                  {database.dbname}
                </td>
                <td className="query-count">
                  <span className={database.lastSample.countClassName}>
                    {database.lastSample.nbQueries}
                  </span>
                </td>
                {
                  database.lastSample.topFiveQueries.map(query => (
                    <td className={`Query ${query.elapsedClassName}`}>
                      {query.formatElapsed}
                    </td>
                  ))
                }
              </tr>
            ))
          }
        </tbody>
      </table>
    );
  }
}
