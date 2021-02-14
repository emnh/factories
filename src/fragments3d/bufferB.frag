particle getP(sampler2D ch, vec2 pos) {

    position tpos = getPos(pos, 0, 0, 0);
    vec4 data = texel(ch, tpos.tpos);
    vec4 data2 = texel(ch, tpos.tposZ);
    particle P = getParticle(data, data2, tpos.addpos);
    
    if(P.M.x != 0.) //not vacuum
    {
        Simulation(ch0, P, pos);
    }
    
    //if(length(P.X.xy - R*vec2(0.8, 0.9)) < 10.) 
    if(length(P.X.xy - R*vec2(0.8, 0.9)) < 10.) 
    {
        P.X = tpos.addpos;
        P.V.xy = 0.5*Dir(-PI*0.25 - PI*0.5 + 0.3*sin(0.4*time));
        P.V.z = 0.0;
        P.M = mix(P.M, vec2(fluid_rho, 1.), 0.4);
    }

    if(length(P.X.xy - R*vec2(0.2, 0.9)) < 10.) 
    {
        P.X = tpos.addpos;
        P.V.xy = 0.5*Dir(-PI*0.25 + 0.3*sin(0.3*time));
        P.V.z = 0.0;
        P.M = mix(P.M, vec2(fluid_rho, 0.), 0.4);
    }
    
    return P;
}

void mainImage( out vec4 U, in vec2 pos )
{
    R = iResolutionOne.xy; time = iTime; Mouse = iMouse;
    // ivec2 p = ivec2(pos);
    
    particle P = getP(ch0, pos);
    
    position tpos = getPos(pos, 0, 0, 0);
        
    U = saveParticle(P, pos, tpos.addpos);
}
