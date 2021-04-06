void mainImage( out vec4 U, in vec2 pos )
{
    R = iResolutionOne.xy; time = iTime; Mouse = iMouse;
    ivec2 p = ivec2(pos);

    //particle P;
     
    position tpos = getPos(pos, 0, 0, 0);
    vec4 data = texel(ch0, tpos.tpos);
    vec4 data2 = texel(ch0, tpos.tposZ);
    particle P = getParticle(data, data2, tpos.addpos);

    Reintegration(ch0, P, pos);
   
    //initial condition
    if(iFrame < 1)
    {
        //random
        vec3 rand = hash32(pos);
        if(rand.z < 0.) 
        {
            P.X = tpos.addpos;
            P.V.xy = 0.5*(rand.xy-0.5) + vec2(0., 0.);
            P.V.z = 0.0;
            P.M = vec2(mass, 0.);
        }
        else
        {
            P.X = tpos.addpos;
            P.V = vec3(0.);
            P.M = vec2(1e-6);
        }
    }
    
    U = saveParticle(P, pos, tpos.addpos);
}
