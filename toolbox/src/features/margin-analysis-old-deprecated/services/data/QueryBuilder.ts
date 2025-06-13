export class QueryBuilder {
  buildMarginQuery(filters: any): string {
    return 'SELECT * FROM ods_hds_orderheader WHERE 1=1'
  }
}

export const queryBuilder = new QueryBuilder()
export default QueryBuilder 