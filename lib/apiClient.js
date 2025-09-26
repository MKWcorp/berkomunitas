const BASE_URL = '/api';

/**
 * A helper function to handle fetch responses, parsing JSON and throwing errors.
 * @param {Response} response - The fetch response object.
 * @returns {Promise<any>} - The JSON data from the response.
 * @throws {Error} - Throws an error with a message from the server if the network response is not ok.
 */
async function handleResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }
  return data;
}

/**
 * Fetches AI-generated tasks for a specific member with pagination and search.
 * @param {object} params - The parameters for the query.
 * @param {string} params.memberId - The ID of the member.
 * @param {number} params.page - The page number for pagination.
 * @param {number} params.pageSize - The number of items per page.
 * @param {string} params.search - The search term.
 * @returns {Promise<any>} - The API response data.
 */
export async function getTasks({ memberId, page, pageSize, search, status, sortBy, sortOrder }) {
  const queryParams = new URLSearchParams({
    memberId,
    page,
    pageSize,
    search,
    ...(status && { status }),
    ...(sortBy && { sortBy }),
    ...(sortOrder && { sortOrder }),
  });
  const response = await fetch(`${BASE_URL}/tugas-ai?${queryParams}`);
  return handleResponse(response);
}

/**
 * Creates a new task submission record when a user starts a task.
 * NOTE: This function is deprecated - N8N webhook now handles task submission creation
 * @deprecated Use N8N webhook directly instead
 * @param {object} data - The data for the POST request.
 * @param {string} data.memberId - The ID of the member.
 * @param {string} data.taskId - The ID of the task.
 * @returns {Promise<any>} - The API response data.
 */
export async function createTaskSubmission({ memberId: _memberId, taskId: _taskId }) {
  console.warn('createTaskSubmission is deprecated - N8N webhook handles this now');
  throw new Error('This function is deprecated. Use N8N webhook directly.');
  // const response = await fetch(`${BASE_URL}/task-submissions/create`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({ id_member: memberId, id_task: taskId }),
  // });
  // return handleResponse(response);
}

/**
 * Fetches the submission statuses for all tasks for a given member.
 * Note: This endpoint may need to be created if it doesn't exist.
 * @param {string} memberId - The ID of the member.
 * @returns {Promise<any>} - The API response data.
 */
export async function getTaskStatuses(_memberId, _taskId) {
  const response = await fetch(`${BASE_URL}/task-submissions?memberId=${memberId}`);
  return handleResponse(response);
}
