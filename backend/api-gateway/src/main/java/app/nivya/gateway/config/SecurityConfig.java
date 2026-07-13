package app.nivya.gateway.config;

import app.nivya.gateway.security.JwtAuthenticationManager;
import app.nivya.gateway.security.JwtSecurityContextRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    private final JwtAuthenticationManager jwtAuthenticationManager;
    private final JwtSecurityContextRepository jwtSecurityContextRepository;

    public SecurityConfig(JwtAuthenticationManager jwtAuthenticationManager,
                          JwtSecurityContextRepository jwtSecurityContextRepository) {
        this.jwtAuthenticationManager = jwtAuthenticationManager;
        this.jwtSecurityContextRepository = jwtSecurityContextRepository;
    }

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity serverHttpSecurity) {
        return serverHttpSecurity
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .httpBasic(ServerHttpSecurity.HttpBasicSpec::disable)
                .formLogin(ServerHttpSecurity.FormLoginSpec::disable)
                .authenticationManager(jwtAuthenticationManager)
                .securityContextRepository(jwtSecurityContextRepository)
                .authorizeExchange(exchanges -> exchanges
                        .pathMatchers(ApiPaths.PUBLIC_PATHS).permitAll()
                        .anyExchange().authenticated()
                )
                .build();
    }
}
