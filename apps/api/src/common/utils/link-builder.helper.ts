/**
 * Link Builder Utilities
 * Builds pagination and resource links following Zalando RESTful API Guidelines
 * Supports full absolute URIs as per Zalando specification
 */

import { PaginationMeta } from './pagination.helper';

export interface CollectionLinks {
  self: string;
  first: string;
  last: string;
  next?: string | null;
  prev?: string | null;
}

export interface ResourceLinks {
  self: string;
  [key: string]: string;
}

export class LinkBuilder {
  /**
   * Build full absolute URI from request.
   * Zalando guideline: "MUST use full, absolute URI for resource identification"
   */
  static buildAbsoluteUrl(
    protocol: string,
    host: string,
    path: string,
    queryParams?: Record<string, unknown>,
  ): string {
    const baseUrl = `${protocol}://${host}${path}`;

    if (!queryParams || Object.keys(queryParams).length === 0) {
      return baseUrl;
    }

    const queryString = this.buildQueryString(queryParams);
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  /**
   * Build pagination links for collection endpoints
   */
  static buildCollectionLinks(
    protocol: string,
    host: string,
    path: string,
    pagination: PaginationMeta,
    queryParams?: Record<string, unknown>,
  ): CollectionLinks {
    const filteredParams = this.filterPaginationParams(queryParams);

    const buildUrl = (page: number): string => {
      const params = {
        ...filteredParams,
        page,
        limit: pagination.limit,
      };
      return this.buildAbsoluteUrl(protocol, host, path, params);
    };

    return {
      self: buildUrl(pagination.page),
      first: buildUrl(1),
      last: buildUrl(pagination.total_pages || 1),
      next: pagination.has_next ? buildUrl(pagination.page + 1) : null,
      prev: pagination.has_prev ? buildUrl(pagination.page - 1) : null,
    };
  }

  /**
   * Build self link for a single resource
   */
  static buildSelfLink(
    protocol: string,
    host: string,
    path: string,
    id: string | number,
  ): string {
    return `${protocol}://${host}${path}/${id}`;
  }

  /**
   * Build resource links for HATEOAS
   */
  static buildResourceLinks(
    protocol: string,
    host: string,
    path: string,
    id: string | number,
    relations?: Record<string, string>,
  ): ResourceLinks {
    const links: ResourceLinks = {
      self: this.buildSelfLink(protocol, host, path, id),
    };

    if (relations) {
      for (const [key, relativePath] of Object.entries(relations)) {
        links[key] = `${protocol}://${host}${relativePath}`;
      }
    }

    return links;
  }

  /**
   * Extract protocol and host from request
   */
  static extractBaseUrl(request: {
    protocol: string;
    get: (name: string) => string | undefined;
  }): { protocol: string; host: string } {
    const protocol = request.protocol || 'http';
    const host = request.get('host') || 'localhost:3000';

    return { protocol, host };
  }

  /**
   * Filter out pagination parameters from query params
   */
  private static filterPaginationParams(
    queryParams?: Record<string, unknown>,
  ): Record<string, unknown> {
    if (!queryParams) return {};

    const filtered: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(queryParams)) {
      if (
        key !== 'page' &&
        key !== 'limit' &&
        value !== undefined &&
        value !== null &&
        value !== ''
      ) {
        filtered[key] = value;
      }
    }

    return filtered;
  }

  /**
   * Build query string from parameters
   */
  private static buildQueryString(params: Record<string, unknown>): string {
    const queryParts: string[] = [];

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
      }
    }

    return queryParts.join('&');
  }
}
