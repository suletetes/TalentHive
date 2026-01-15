backend archutecture diagram 

flowchart TD

    A[Client Layer] --> B[API Gateway - Express.js]

    B --> C[Authentication Layer]

    C --> D[Routing Layer]

    D --> E[Controller Layer]

    E --> F[Service Layer]

    F --> G[Data Access Layer - Mongoose]

    G --> H[(MongoDB Database)]

    F --> I[External Services]

    subgraph Clients[Clients]

        A1[Web App]

        A2[Mobile App]

        A3[Third-Party]

    end

    subgraph Auth[Authentication]

        C1[JWT Tokens]

        C2[Password Hashing]

        C3[Role-Based Access]

    end

    subgraph Routes[Routes]

        D1[Auth Routes]

        D2[Project Routes]

        D3[Payment Routes]

    end

    subgraph Controllers[Controllers]

        E1[Auth Controller]

        E2[Project Controller]

        E3[Payment Controller]

    end

    subgraph Services[Business Logic]

        F1[Auth Service]

        F2[Email Service]

        F3[Payment Service]

    end

    subgraph Models[Data Models]

        G1[User Model]

        G2[Project Model]

        G3[Contract Model]

    end

    subgraph External[External APIs]

        I1[Stripe]

        I2[Nodemailer]

        I3[Socket.io]

        I4[Cloudinary]

    end

    A --> Clients

    C --> Auth

    D --> Routes

    E --> Controllers

    F --> Services

    G --> Models

    I --> External

    style A fill:#E3F2FD,color:#000

    style B fill:#1976D2,color:#fff

    style C fill:#1565C0,color:#fff

    style D fill:#42A5F5,color:#fff

    style E fill:#64B5F6,color:#fff

    style F fill:#90CAF9,color:#000

    style G fill:#BBDEFB,color:#000

    style H fill:#FF9800,color:#fff

    style I fill:#4CAF50,color:#fff


frontend archutecture diagram 
flowchart TD
    A[User Interface Layer] --> B[Presentation Components]
    B --> C[State Management - Redux]
    C --> D[Service Layer - API]
    D --> E[Utility Layer]
    E --> F[Backend REST API]

    subgraph UI[User Interface]
        A1[Admin Dashboard]
        A2[Client Dashboard]
        A3[Freelancer Dashboard]
    end

    subgraph Components[Components]
        B1[Project Components]
        B2[Payment Components]
        B3[Messaging Components]
    end

    subgraph State[Redux Store]
        C1[Auth State]
        C2[Projects State]
        C3[Messages State]
    end

    subgraph Services[API Services]
        D1[Auth Service]
        D2[Project Service]
        D3[Payment Service]
    end

    A --> UI
    B --> Components
    C --> State
    D --> Services

    style A fill:#1976D2,color:#fff
    style B fill:#42A5F5,color:#fff
    style C fill:#64B5F6,color:#fff
    style D fill:#90CAF9,color:#fff
    style E fill:#BBDEFB,color:#000
    style F fill:#4CAF50,color:#fff
