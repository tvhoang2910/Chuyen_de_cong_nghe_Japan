# ===== BUILD =====
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG VITE_AUTH_API_BASE_URL=/api/v1/auth
ARG VITE_EXAM_API_BASE_URL=/api/v1/exam
ARG VITE_SEARCH_API_BASE_URL=/api/v1/search
ARG VITE_STUDY_API_BASE_URL=/api/v1/study
ARG VITE_COMMUNITY_API_BASE_URL=/api/v1/community
ARG VITE_ANALYTICS_API_BASE_URL=/api/v1/analytics

ENV VITE_AUTH_API_BASE_URL=${VITE_AUTH_API_BASE_URL}
ENV VITE_EXAM_API_BASE_URL=${VITE_EXAM_API_BASE_URL}
ENV VITE_SEARCH_API_BASE_URL=${VITE_SEARCH_API_BASE_URL}
ENV VITE_STUDY_API_BASE_URL=${VITE_STUDY_API_BASE_URL}
ENV VITE_COMMUNITY_API_BASE_URL=${VITE_COMMUNITY_API_BASE_URL}
ENV VITE_ANALYTICS_API_BASE_URL=${VITE_ANALYTICS_API_BASE_URL}

RUN npm run build

# ===== RUN =====
FROM nginx:1.26-alpine

# nginx.conf is copied into the image so the container is self-contained.
# (No volume mount of ./Nginx/nginx.conf from host required.)
COPY --from=build /app/dist /usr/share/nginx/html
COPY Nginx/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
