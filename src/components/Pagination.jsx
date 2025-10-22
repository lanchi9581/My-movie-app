import React from 'react';

// Pagination Button Component
const PaginationButton = ({ iconClass, handleClick, disabled, ariaLabel }) => (
  <button
    onClick={handleClick}
    disabled={disabled}
    className="load-more-btn"
    aria-label={ariaLabel}
  >
    <i className={iconClass}></i>
  </button>
);

// Main Pagination Component
const Pagination = ({ page, totalPages, setPage, loading }) => {
  if (loading || totalPages <= 1) return null;

  return (
    <div className="pagination">
      <PaginationButton
        iconClass="bx bxs-chevrons-left"
        handleClick={() => setPage(1)}
        disabled={page === 1}
        ariaLabel="Go to first page"
      />
      <PaginationButton
        iconClass="bx bxs-chevron-left"
        handleClick={() => setPage((p) => Math.max(p - 1, 1))}
        disabled={page === 1}
        ariaLabel="Go to previous page"
      />

      <span className="load-more-btn">
        Page {page} of {totalPages}
      </span>

      <PaginationButton
        iconClass="bx bxs-chevron-right"
        handleClick={() => setPage((p) => Math.min(p + 1, totalPages))}
        disabled={page === totalPages}
        ariaLabel="Go to next page"
      />
      <PaginationButton
        iconClass="bx bxs-chevrons-right"
        handleClick={() => setPage(totalPages)}
        disabled={page === totalPages}
        ariaLabel="Go to last page"
      />
    </div>
  );
};

export default Pagination;
