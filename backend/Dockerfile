# syntax=docker/dockerfile:1

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Proje dosyalarını önce kopyalayıp restore etmek, kod değiştiğinde
# katman cache'inin (NuGet restore) bozulmasını engeller.
COPY BayiPortal.sln ./
COPY src/BayiPortal.Core/BayiPortal.Core.csproj src/BayiPortal.Core/
COPY src/BayiPortal.Application/BayiPortal.Application.csproj src/BayiPortal.Application/
COPY src/BayiPortal.Infrastructure/BayiPortal.Infrastructure.csproj src/BayiPortal.Infrastructure/
COPY src/BayiPortal.API/BayiPortal.API.csproj src/BayiPortal.API/
RUN dotnet restore src/BayiPortal.API/BayiPortal.API.csproj

COPY src/ src/
RUN dotnet publish src/BayiPortal.API/BayiPortal.API.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "BayiPortal.API.dll"]
