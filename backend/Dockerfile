FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

COPY target/*.jar app.jar

EXPOSE 8083

HEALTHCHECK --interval=30s --timeout=3s --start-period=60s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8083/api/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
