import TablePagination from "../shared/TablePagination";

export default function BatchPagination({ page, totalPages, onPageChange }) {
  return <TablePagination page={page} totalPages={totalPages} onPageChange={onPageChange} />;
}
