package app.nivya.gateway.filter;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class JwtAuthFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange serverWebExchange, GatewayFilterChain gatewayFilterChain) {
        return ReactiveSecurityContextHolder.getContext()
                .map(SecurityContext::getAuthentication)
                .filter(authentication -> authentication != null && authentication.isAuthenticated())
                .flatMap(authentication -> {
                    String userId = authentication.getPrincipal().toString();
                    ServerWebExchange mutatedExchange = serverWebExchange.mutate()
                            .request(request -> request.header("X-User-Id", userId))
                            .build();
                    return gatewayFilterChain.filter(mutatedExchange);
                })
                .switchIfEmpty(gatewayFilterChain.filter(serverWebExchange));
    }

    @Override
    public int getOrder() {
        return 0;
    }
}
