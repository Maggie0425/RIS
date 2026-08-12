FROM maven:3.9.12-eclipse-temurin-21-alpine AS build

WORKDIR /workspace
COPY pom.xml ./
RUN mvn dependency:go-offline

COPY src ./src
RUN mvn package -DskipTests

FROM eclipse-temurin:21-jre-alpine

WORKDIR /app
RUN addgroup -S ris && adduser -S ris -G ris
COPY --from=build /workspace/target/ris-backend-*.jar app.jar

USER ris
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
